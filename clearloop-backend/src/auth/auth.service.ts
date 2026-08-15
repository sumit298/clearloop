import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { EmailService } from '../email/email.service';

// Reset tokens are looked up by hash, so the digest must be deterministic.
// Same approach as invitations: raw token to the user, digest in the DB.
function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESET_REQUEST_WINDOW_MS = 15 * 60 * 1000;
const RESET_REQUESTS_PER_WINDOW = 3;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private email: EmailService,
  ) {}

  // ---------------------------------------------------------------------
  // Register (password signup)
  // ---------------------------------------------------------------------

  async register(dto: RegisterDto) {
    const baseSlug = dto.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);

    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${randomSuffix}`;

    const existing = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      const newSuffix = Math.random().toString(36).substring(2, 8);
      return this.createWorkspace(dto, `${baseSlug}-${newSuffix}`);
    }

    return this.createWorkspace(dto, slug);
  }

  private async createWorkspace(dto: RegisterDto, slug: string) {
    const email = dto.email.toLowerCase();
    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      // Global identity may already exist (e.g. invited elsewhere first).
      let user = await tx.user.findUnique({ where: { email } });

      if (!user) {
        user = await tx.user.create({
          data: { email, name: dto.name, passwordHash },
        });
      } else {
        // Existing global identity (with or without a password): do not let
        // an unauthenticated caller silently take it over just by knowing
        // the email. Route password-claims through an authenticated /
        // email-verified flow instead.
        throw new BadRequestException(
          'An account with this email already exists. Please log in instead.',
        );
      }

      const tenant = await tx.tenant.create({
        data: { name: dto.companyName, slug },
      });

      const member = await tx.workspaceMember.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          email,
          name: dto.name,
          role: 'ADMIN',
        },
      });

      return this.signToken({
        userId: user.id,
        memberId: member.id,
        tenantId: tenant.id,
        role: member.role,
        tokenVersion: member.tokenVersion,
      });
    });
  }

  // ---------------------------------------------------------------------
  // Password login
  // ---------------------------------------------------------------------

  async loginByEmail(dto: LoginDto) {
    const email = dto.email.toLowerCase();

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId: user.id, isActive: true },
      include: { tenant: { select: { id: true, name: true, slug: true } } },
    });

    if (memberships.length === 0) {
      throw new UnauthorizedException('No active workspaces found for user');
    }

    if (memberships.length === 1) {
      const member = memberships[0]!;
      return this.signToken({
        userId: user.id,
        memberId: member.id,
        tenantId: member.tenantId,
        role: member.role,
        tokenVersion: member.tokenVersion,
      });
    }

    return this.createLoginSession(user.id, memberships);
  }

  // ---------------------------------------------------------------------
  // Password reset
  // ---------------------------------------------------------------------

  // Always resolves to the same generic response so an unauthenticated
  // caller cannot use this endpoint to discover which emails have accounts.
  async requestPasswordReset(rawEmail: string, ipAddress?: string) {
    const genericResponse = {
      message:
        'If an account exists for that email, a reset link has been sent.',
    };

    const email = rawEmail.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      return genericResponse;
    }

    const recentRequests = await this.prisma.passwordResetToken.count({
      where: {
        userId: user.id,
        createdAt: { gt: new Date(Date.now() - RESET_REQUEST_WINDOW_MS) },
      },
    });

    if (recentRequests >= RESET_REQUESTS_PER_WINDOW) {
      return genericResponse;
    }

    // Any earlier link becomes dead the moment a new one is issued.
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = crypto.randomBytes(32).toString('hex');

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        ipAddress,
      },
    });

    // Deliberately not awaited. Awaiting it would make a request for a real
    // account take as long as the Brevo call (up to 10s) while an unknown
    // address returns immediately — a timing oracle that hands back exactly
    // the account-existence answer the generic message is hiding.
    void this.email
      .sendPasswordResetEmail(user.email, rawToken, user.name ?? undefined)
      .catch((error) => {
        console.error('Failed to send password reset email:', error);
      });

    return genericResponse;
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
      include: { user: true },
    });

    // BadRequest, not Unauthorized: a 401 would trip the frontend's
    // "session expired" interceptor and bounce the user off the page.
    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt < new Date() ||
      !resetToken.user.isActive
    ) {
      throw new BadRequestException(
        'This reset link is invalid or has expired. Please request a new one.',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      // Kill every other outstanding reset link for this user.
      await tx.passwordResetToken.updateMany({
        where: { userId: resetToken.userId, usedAt: null },
        data: { usedAt: new Date() },
      });

      // Bumping tokenVersion invalidates every JWT already issued for this
      // user's memberships, so a stolen session dies with the reset.
      await tx.workspaceMember.updateMany({
        where: { userId: resetToken.userId },
        data: { tokenVersion: { increment: 1 } },
      });

      await tx.loginSession.updateMany({
        where: { userId: resetToken.userId, status: 'PENDING' },
        data: { status: 'EXPIRED' },
      });
    });

    return { message: 'Password updated. You can now sign in.' };
  }

  // ---------------------------------------------------------------------
  // Multi-workspace selection (LoginSession-backed)
  // ---------------------------------------------------------------------

  // Shared by password login and OAuth: stores a short-lived, hashed,
  // one-time session token bound to THIS proven login. The raw token goes
  // to the client; only its hash is stored, same principle as invitations.
  private async createLoginSession(
    userId: string,
    memberships: Array<{
      id: string;
      tenantId: string;
      role: string;
      tenant: { id: string; name: string; slug: string };
    }>,
  ) {
    const rawSessionToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawSessionToken, 10);

    await this.prisma.loginSession.create({
      data: {
        userId,
        tokenHash,
        status: 'PENDING',
        workspaces: memberships.map((m) => ({
          id: m.tenant.id,
          name: m.tenant.name,
          slug: m.tenant.slug,
        })),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    return {
      requiresWorkspaceSelection: true,
      sessionToken: rawSessionToken,
      workspaces: memberships.map((m) => ({
        id: m.tenant.id,
        name: m.tenant.name,
        slug: m.tenant.slug,
      })),
    };
  }

  async selectWorkspace(sessionToken: string, tenantId: string) {
    const candidates = await this.prisma.loginSession.findMany({
      where: { status: 'PENDING', expiresAt: { gt: new Date() } },
    });

    let matchedSession: (typeof candidates)[number] | null = null;
    for (const session of candidates) {
      if (await bcrypt.compare(sessionToken, session.tokenHash)) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession || !matchedSession.userId) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const workspaces = matchedSession.workspaces as { id: string }[];
    const isAllowed = workspaces.some((w) => w.id === tenantId);
    if (!isAllowed) {
      throw new UnauthorizedException(
        'Workspace not permitted for this session',
      );
    }

    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_tenantId: { userId: matchedSession.userId, tenantId } },
    });

    if (!member || !member.isActive) {
      throw new UnauthorizedException('Membership not found or inactive');
    }

    await this.prisma.loginSession.update({
      where: { id: matchedSession.id },
      data: { status: 'USED', usedAt: new Date(), selectedTenantId: tenantId },
    });

    return this.signToken({
      userId: matchedSession.userId,
      memberId: member.id,
      tenantId,
      role: member.role,
      tokenVersion: member.tokenVersion,
    });
  }

  async getMyWorkspaces(userId: string, currentTenantId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId, isActive: true },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
      },
    });

    const workspaces = memberships.map((membership) => ({
      id: membership.tenant.id,
      name: membership.tenant.name,
      slug: membership.tenant.slug,
      role: membership.role,
      isCurrent: membership.tenant.id === currentTenantId,
    }));

    return workspaces;
  }

  async switchWorkspace(userId: string, tenantId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });

    if (!member || !member.isActive) {
      throw new UnauthorizedException('Not a member of this workspace');
    }

    return this.signToken({
      userId,
      memberId: member.id,
      tenantId,
      role: member.role,
      tokenVersion: member.tokenVersion,
    });
  }

  // ---------------------------------------------------------------------
  // OAuth (Google / GitHub)
  // ---------------------------------------------------------------------

  async validateOAuthUser(profile: any, provider: 'google' | 'github') {
    const { email: rawEmail, name, avatarUrl } = profile;
    if (!rawEmail) {
      throw new UnauthorizedException('Email is required for authentication');
    }
    const email = rawEmail.toLowerCase();

    const providerAccountId =
      provider === 'google' ? profile.googleId : profile.githubId;
    const authProvider = provider.toUpperCase() as 'GOOGLE' | 'GITHUB';

    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: { email, name, avatarUrl },
      });
    }

    const existingIdentity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerAccountId: {
          provider: authProvider,
          providerAccountId,
        },
      },
    });

    if (!existingIdentity) {
      await this.prisma.authIdentity.create({
        data: {
          userId: user.id,
          provider: authProvider,
          providerAccountId,
          email,
          avatarUrl,
        },
      });
    }

    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId: user.id, isActive: true },
      include: { tenant: { select: { id: true, name: true, slug: true } } },
    });

    if (memberships.length === 0) {
      return this.createOAuthWorkspace(user, profile, provider);
    }

    if (memberships.length === 1) {
      const member = memberships[0]!;
      return this.signToken({
        userId: user.id,
        memberId: member.id,
        tenantId: member.tenantId,
        role: member.role,
        tokenVersion: member.tokenVersion,
      });
    }

    return this.createLoginSession(user.id, memberships);
  }

  private async createOAuthWorkspace(
    user: {
      id: string;
      email: string;
      name: string | null;
      avatarUrl: string | null;
    },
    profile: any,
    provider: 'google' | 'github',
  ) {
    const domain = user.email.split('@')[1]?.split('.')[0];
    if (!domain) {
      throw new BadRequestException('Cannot extract company name from email');
    }

    const baseSlug = domain
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 30);
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;
    const companyName = domain.charAt(0).toUpperCase() + domain.slice(1);

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: companyName, slug },
      });

      const member = await tx.workspaceMember.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          githubUsername: provider === 'github' ? profile.githubUsername : null,
          role: 'ADMIN',
        },
      });

      return this.signToken({
        userId: user.id,
        memberId: member.id,
        tenantId: tenant.id,
        role: member.role,
        tokenVersion: member.tokenVersion,
      });
    });
  }

  // ---------------------------------------------------------------------
  // Token signing
  // ---------------------------------------------------------------------

  signToken(params: {
    userId: string;
    memberId: string;
    tenantId: string;
    role: string;
    tokenVersion: number;
  }) {
    const { userId, memberId, tenantId, role, tokenVersion } = params;
    const token = this.jwt.sign({
      sub: userId,
      memberId,
      tenantId,
      role,
      tokenVersion,
    });
    return { access_token: token };
  }
}

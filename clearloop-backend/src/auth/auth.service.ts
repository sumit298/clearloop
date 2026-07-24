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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
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
      }
      else if(user.passwordHash){
        throw new BadRequestException('Account already exists, please log in');
      }
      else {
        // oauth only account claiming for first time
        user = await tx.user.update({
          where: { id: user.id },
          data: { passwordHash },
        
        })
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
      throw new UnauthorizedException('Workspace not permitted for this session');
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
        provider_providerAccountId: { provider: authProvider, providerAccountId },
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
    user: { id: string; email: string; name: string | null; avatarUrl: string | null },
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

  private signToken(params: {
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
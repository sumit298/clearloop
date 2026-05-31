import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Auto-generate slug from company name + random suffix
    const baseSlug = dto.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);

    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${randomSuffix}`;

    const existing = await this.prisma.tenant.findUnique({
      where: { slug },
    });
    if (existing) {
      // Extremely rare collision, try again with different suffix
      const newSuffix = Math.random().toString(36).substring(2, 8);
      const newSlug = `${baseSlug}-${newSuffix}`;
      return this.createWorkspace(dto, newSlug);
    }

    return this.createWorkspace(dto, slug);
  }

  private async createWorkspace(dto: RegisterDto, slug: string) {
    const hashed = await bcrypt.hash(dto.password, 10);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.companyName,
        slug,
        users: {
          create: {
            email: dto.email,
            name: dto.name,
            password: hashed,
            role: 'ADMIN',
          },
        },
      },
      include: { users: true },
    });

    const user = tenant.users[0];
    if (!user) throw new InternalServerErrorException('User creation failed');
    return this.signToken(user.id, tenant.id, user.role);
  }

  async loginByEmail(dto: LoginDto) {
    // Find all workspaces user belongs to
    const users = await this.prisma.user.findMany({
      where: { email: dto.email },
      include: { tenant: true },
    });

    if (users.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password with first user (all should have same password)
    const user = users[0];
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // If multiple workspaces, return list for selection
    if (users.length > 1) {
      // Generate selection tokens for each workspace
      const selectionTokens = await Promise.all(
        users.map(async (u) => {
          const token = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

          await this.prisma.workspaceSelectionToken.create({
            data: {
              token,
              email: dto.email,
              tenantId: u.tenant.id,
              expiresAt,
            },
          });

          return {
            id: u.tenant.id,
            name: u.tenant.name,
            slug: u.tenant.slug,
            selectionToken: token,
          };
        }),
      );

      return {
        requiresWorkspaceSelection: true,
        workspaces: selectionTokens,
      };
    }

    // Single workspace - login directly
    return this.signToken(user.id, user.tenantId, user.role);
  }

  async login(dto: LoginDto, slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new UnauthorizedException('Invalid credentials');

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: dto.email } },
    });
    if (!user || !user.password)
      throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user.id, tenant.id, user.role);
  }

  private signToken(userId: string, tenantId: string, role: string) {
    const token = this.jwt.sign({ sub: userId, tenantId, role });
    return { access_token: token };
  }

  async validateOAuthUser(profile: any, provider: 'google' | 'github') {
    const { email, name, avatarUrl, tenant } = profile;

    if (!email) {
      throw new UnauthorizedException('Email is required for authentication');
    }

    const providerId =
      provider === 'google' ? profile.googleId : profile.githubId;

    const users = await this.prisma.user.findMany({
      where: { email },
      include: { tenant: true },
    });

    if (users.length === 0) {
      return this.createOAuthUser(
        email,
        name,
        avatarUrl,
        providerId,
        provider,
        profile,
      );
    }

    if (users.length === 1) {
      const user = users[0];

      if (!user) throw new UnauthorizedException('User not found');

      if (!user[provider === 'google' ? 'googleId' : 'githubId']) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            [provider === 'google' ? 'googleId' : 'githubId']: providerId,
            oauthProvider: provider,
            avatarUrl: avatarUrl || user.avatarUrl,
            githubUsername:
              provider === 'github'
                ? profile.githubUsername
                : user.githubUsername,
          },
        });
      }
      return this.signToken(user.id, user.tenantId, user.role);
    }

    // Generate selection tokens for each workspace
    const selectionTokens = await Promise.all(
      users.map(async (u) => {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

        await this.prisma.workspaceSelectionToken.create({
          data: {
            token,
            email,
            tenantId: u.tenant.id,
            expiresAt,
          },
        });

        return {
          id: u.tenant.id,
          name: u.tenant.name,
          slug: u.tenant.slug,
          selectionToken: token,
        };
      }),
    );

    return {
      requiresWorkspaceSelection: true,
      workspaces: selectionTokens,
    };
  }

  async selectWorkspace(
    email: string,
    workspaceId: string,
    selectionToken: string,
  ) {
    // Validate and consume the selection token
    const tokenRecord = await this.prisma.workspaceSelectionToken.findUnique({
      where: { token: selectionToken },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid selection token');
    }

    if (tokenRecord.consumed) {
      throw new UnauthorizedException('Selection token already used');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Selection token expired');
    }

    if (tokenRecord.email !== email || tokenRecord.tenantId !== workspaceId) {
      throw new UnauthorizedException('Selection token mismatch');
    }

    // Mark token as consumed
    await this.prisma.workspaceSelectionToken.update({
      where: { token: selectionToken },
      data: { consumed: true },
    });

    // Find the user
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        tenantId: workspaceId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found in workspace');
    }

    return this.signToken(user.id, user.tenantId, user.role);
  }

  private async createOAuthUser(
    email: string,
    name: string,
    avatarUrl: string | null,
    providerId: string,
    provider: 'google' | 'github',
    profile: any,
  ) {
    // Extract company name from email domain
    const parts = email.split('@');
    const domain = parts[1];

    if (!domain) {
      throw new BadRequestException('Invalid email format');
    }

    const companyName = domain.split('.')[0];

    if (!companyName) {
      throw new BadRequestException('Cannot extract company name from email');
    }

    const baseSlug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);

    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${randomSuffix}`;

    const tenant = await this.prisma.tenant.create({
      data: {
        name: companyName.charAt(0).toUpperCase() + companyName.slice(1),
        slug,
        users: {
          create: {
            email,
            name,
            avatarUrl,
            [provider === 'google' ? 'googleId' : 'githubId']: providerId,
            oauthProvider: provider,
            githubUsername:
              provider === 'github' ? profile.githubUsername : null,
            role: 'ADMIN',
          },
        },
      },
      include: { users: true },
    });

    const user = tenant.users[0];
    if (!user) throw new InternalServerErrorException('User creation failed');

    return this.signToken(user.id, tenant.id, user.role);
  }
}

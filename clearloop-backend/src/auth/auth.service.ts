import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto';

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
      return {
        requiresWorkspaceSelection: true,
        workspaces: users.map((u) => ({
          id: u.tenant.id,
          name: u.tenant.name,
          slug: u.tenant.slug,
        })),
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

    if(!email){
      throw new UnauthorizedException("Email is required for authentication")
    }
    const providerId =
      provider === 'google' ? profile.googleId : profile.githubId;

    const tenantRecord = await this.prisma.tenant.findUnique({
      where: { slug: tenant },
    });

    if (!tenantRecord) throw new UnauthorizedException('Tenant not found');

    const existingByProvider = await this.prisma.user.findFirst({
      where: {
        tenantId: tenantRecord.id,
        [provider === 'google' ? 'googleId' : 'githubId']: providerId,
      },
    });

    if (existingByProvider)
      return this.signToken(
        existingByProvider.id,
        tenantRecord.id,
        existingByProvider.role,
      );

    const existingByEmail = await this.prisma.user.findFirst({
      where: {
        tenantId: tenantRecord.id,
        email,
      },
    });

    if (existingByEmail) {
      await this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          [provider === 'google' ? 'googleId' : 'githubId']: providerId,
          oauthProvider: provider,
          avatarUrl: avatarUrl || existingByEmail.avatarUrl,
          githubUsername:
            provider === 'github'
              ? profile.githubUsername
              : existingByEmail.githubUsername,
        },
      });

      return this.signToken(
        existingByEmail.id,
        tenantRecord.id,
        existingByEmail.role,
      );
    }

    const newUser = await this.prisma.user.create({
      data: {
        email,
        name,
        tenantId: tenantRecord.id,
        avatarUrl,
        [provider === 'google' ? 'googleId' : 'githubId']: providerId,
        oauthProvider: provider,
        githubUsername: provider === 'github' ? profile.githubUsername : null,
        role: 'DEVELOPER',
      },
    });
    return this.signToken(newUser.id, tenantRecord.id, newUser.role);
  }
}

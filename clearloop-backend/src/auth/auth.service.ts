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
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new ConflictException('Slug already taken');

    const hashed = await bcrypt.hash(dto.password, 10);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.companyName,
        slug: dto.slug,
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

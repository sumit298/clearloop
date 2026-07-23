import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: any) {
    if (!payload.tenantId || !payload.sub || !payload.memberId) {
      throw new UnauthorizedException();
    }

    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: payload.memberId },
    });

    if (!member || !member.isActive) {
      throw new UnauthorizedException('Membership inactive');
    }

    if (member.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    return {
      userId: payload.sub,
      memberId: payload.memberId,
      tenantId: payload.tenantId,
      role: payload.role,
    };
  }
}
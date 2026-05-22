import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  async create(
    tenantId: string,
    email: string,
    role: UserRole,
    invitedBy: string,
  ) {
    const existing = await this.prisma.user.findFirst({
      where: { tenantId, email },
    });

    if (existing) {
      throw new BadRequestException('User already exists');
    }

    const existingInvite = await this.prisma.invitation.findFirst({
      where: {
        tenantId,
        email,
        acceptedAt: null,
        expiresAt: { gte: new Date() }, 
      }
    })

    if (existingInvite) {
      throw new BadRequestException('Invite already sent');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return this.prisma.invitation.create({
      data: {
        tenantId,
        email,
        role,
        token,
        invitedBy,
        expiresAt,
      },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  async validate(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }



    if (invitation.acceptedAt) {
      throw new BadRequestException('Invitation already accepted');
    }

    if(invitation.expiresAt === null){
      throw new BadRequestException('Invitation expired');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation expired');
    }

    return invitation;
  }

  async accept(token: string, name: string, password: string) {
    const invitation = await this.validate(token);

    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        tenantId: invitation.tenantId,
        email: invitation.email,
        name,
        password: hashedPassword,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        invitedAt: new Date(),
      },
    });

    // Mark invitation as accepted
    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });

    return { user, tenant: invitation.tenant };
  }

  async list(tenantId: string) {
    return this.prisma.invitation.findMany({
      where: {
        tenantId,
        acceptedAt: null,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancel(tenantId: string, id: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id, tenantId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.prisma.invitation.delete({ where: { id } });
    return { message: 'Invitation cancelled successfully' };
  }

  async resend(tenantId: string, id: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id, tenantId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Invitation already accepted');
    }

    // Extend expiration
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.invitation.update({
      where: { id },
      data: { expiresAt },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }
}

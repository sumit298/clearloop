import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { EmailService } from '../email/email.service';

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(
    tenantId: string,
    email: string,
    role: UserRole,
    invitedByMemberId: string,
  ) {
    const normalizeEmail = email.toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: { email: normalizeEmail },
    });

    if (existing) {
      const existingMembership = await this.prisma.workspaceMember.findUnique({
        where: { userId_tenantId: { userId: existing.id, tenantId } },
      });

      if (existingMembership) {
        throw new BadRequestException(
          'User is already a member of this workspace',
        );
      }
    }

    const existingInvite = await this.prisma.invitation.findFirst({
      where: {
        tenantId,
        email: normalizeEmail,
        status: 'PENDING',
        expiresAt: { gte: new Date() },
      },
    });

    if (existingInvite) {
      throw new BadRequestException('Invite already sent');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const tokenHash = hashToken(token);

    // ✅ Fix 1: added await
    const invitation = await this.prisma.invitation.create({
      data: {
        tenantId,
        email: normalizeEmail,
        role,
        tokenHash,
        invitedByMemberId,
        expiresAt,
      },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    try {
      // ✅ Fix 2: query workspaceMember, not user
      const inviter = await this.prisma.workspaceMember.findUnique({
        where: { id: invitedByMemberId },
        select: { name: true },
      });

      await this.emailService.sendInvitationEmail(
        email,
        inviter?.name || 'Someone',
        invitation.tenant.name,
        token,
      );
    } catch (error) {
      console.error('Failed to send invitation email:', error);
    }

    return invitation;
  }

  async validate(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash },
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

    if (invitation.status === 'ACCEPTED') {
      throw new BadRequestException('Invitation already accepted');
    }

    if (invitation.status === 'REVOKED') {
      throw new BadRequestException('Invitation has been revoked');
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Invitation expired');
    }

    return invitation;
  }

  async accept(token: string, name: string, password: string) {
    const invitation = await this.validate(token);

    return this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email: invitation.email },
      });

      if (!user) {
        // New user — create account with provided password
        const passwordHash = await bcrypt.hash(password, 10);
        user = await tx.user.create({
          data: { email: invitation.email, name, passwordHash },
        });
      } else if (user.passwordHash) {
        // ✅ Fix 3: passwordHash is now guaranteed string, not null
        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
          throw new UnauthorizedException(
            'An account with this email already exists. Enter your existing password to join this workspace.',
          );
        }
      } else {
        // OAuth-only account — no password set, cannot use password flow
        throw new BadRequestException(
          'This account uses Google or GitHub sign-in. Please use the OAuth button to accept this invitation.',
        );
      }

      const member = await tx.workspaceMember.create({
        data: {
          userId: user.id,
          tenantId: invitation.tenantId,
          email: invitation.email,
          name,
          role: invitation.role,
          invitedByMemberId: invitation.invitedByMemberId,
          invitedAt: invitation.createdAt,
          joinedAt: new Date(),
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          acceptedByMemberId: member.id,
        },
      });

      return { user, member, tenant: invitation.tenant };
    });
  }

  async list(tenantId: string) {
    return this.prisma.invitation.findMany({
      where: {
        tenantId,
        status: 'PENDING',
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

    await this.prisma.invitation.update({
      where: { id },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });
    return { message: 'Invitation cancelled successfully' };
  }

  async resend(tenantId: string, id: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id, tenantId },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status === 'ACCEPTED') {
      throw new BadRequestException('Invitation already accepted');
    }

    const rawToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const tokenHash = hashToken(rawToken);

    const updated = await this.prisma.invitation.update({
      where: { id },
      data: { tokenHash, expiresAt, status: 'PENDING' },
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

    try {
      const inviter = await this.prisma.workspaceMember.findUnique({
        where: { id: updated.invitedByMemberId || '' },
        select: { name: true },
      });

      await this.emailService.sendInvitationEmail(
        invitation.email,
        inviter?.name || 'Someone',
        invitation.tenant.name,
        rawToken,
      );
    } catch (error) {
      console.error('Failed to resend invitation email:', error);
    }
    return updated;
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateOwnProfileDto, UpdateUserDto } from './dto/update-user.dto';

const MEMBER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  designation: true,
  isActive: true,
  githubUsername: true,
  avatarUrl: true,
} as const;

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // Adds an existing-or-new person directly to a workspace (no invitation
  // email flow). Mirrors the identity split used in auth.service register():
  // find-or-create the global User, then create a WorkspaceMember for this
  // tenant. NOTE: this bypasses the Invitation flow entirely — worth deciding
  // later whether this endpoint should still exist once invitations work end
  // to end, or whether it's redundant / an admin-only shortcut.

  async create(tenantId: string, dto: CreateUserDto) {
    const email = dto.email.toLowerCase();

    return this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email } });
      if (user) {
        const existingMembership = await tx.workspaceMember.findUnique({
          where: { userId_tenantId: { userId: user.id, tenantId } },
        });

        if (existingMembership)
          throw new ConflictException('User already belongs to this workspace');
      } else {
        user = await tx.user.create({
          data: { email, name: dto.name },
        });
      }
      const member = await tx.workspaceMember.create({
        data: {
          userId: user.id,
          tenantId,
          email,
          name: dto.name,
          role: dto.role || 'DEVELOPER',
          designation: dto.designation,
          githubUsername: dto.githubUsername,
        },
        select: MEMBER_SELECT,
      });
      return member;
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { tenantId },
      select: {
        ...MEMBER_SELECT,
        _count: {
          select: {
            assignedFeatures: true,
            createdFeatures: true,
            projectMembers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { id, tenantId },
      select: {
        ...MEMBER_SELECT,
        assignedFeatures: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
          take: 10,
        },
        projectMembers: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
    if (!member) throw new NotFoundException('member not found');
    return member;
  }

  async updateOwnProfile(
    tenantId: string,
    memberId: string,
    dto: UpdateOwnProfileDto,
  ) {
    const existing = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, tenantId },
    });

    if (!existing) throw new NotFoundException('User not found');

    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: dto,
      select: MEMBER_SELECT,
    });
  }

  async update(
    tenantId: string,
    targetmemberId: string,
    currentUserRole: string,
    dto: UpdateUserDto,
  ) {
    const existing = await this.prisma.workspaceMember.findFirst({
      where: { id: targetmemberId, tenantId },
    });

    if (!existing) throw new NotFoundException('User not found');

    if (dto.role && currentUserRole !== 'ADMIN') {
      throw new ForbiddenException(
        'You do not have permission to change roles',
      );
    }

    if (dto.isActive !== undefined && currentUserRole !== 'ADMIN') {
      throw new ForbiddenException(
        'You do not have permission to change activation status',
      );
    }
    // Role changes and (re)activation both affect what a JWT grants. Bumping
    // tokenVersion invalidates any already-issued JWT for this member so the
    // new role/active state takes effect immediately instead of waiting for
    // natural token expiry (see jwt.strategy.ts).

    const roleOrActiveChanged =
      (dto.role && dto.role !== existing.role) ||
      (dto.isActive !== undefined && dto.isActive !== existing.isActive);

    return this.prisma.workspaceMember.update({
      where: { id: targetmemberId },
      data: {
        ...dto,
        ...(roleOrActiveChanged && { tokenVersion: { increment: 1 } }),
      },
      select: MEMBER_SELECT,
    });
  }

  async deactiveUser(tenantId: string, id: string) {
    const existing = await this.prisma.workspaceMember.findFirst({
      where: { id, tenantId },
    });

    if (!existing) throw new NotFoundException('User not found');

    await this.prisma.workspaceMember.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: 'User deactivated successfully' };
  }

  async reactivateUser(tenantId: string, id: string) {
    const existing = await this.prisma.workspaceMember.findFirst({
      where: { id, tenantId },
    });

    if (!existing) throw new NotFoundException('User not found');

    await this.prisma.workspaceMember.update({
      where: { id },
      data: { isActive: true },
    });
    return { message: 'User reactivated successfully' };
  }
}

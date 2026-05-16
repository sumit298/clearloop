import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email: dto.email,
        },
      },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    return this.prisma.user.create({
      data: {
        ...dto,
        tenantId,
        role: dto.role || 'DEVELOPER', // Default role
        password: null, // User will set password on first login (future feature)
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        designation: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        designation: true,
        isActive: true,
        githubUsername: true,
        createdAt: true,
        avatarUrl: true,
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
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        designation: true,
        isActive: true,
        githubUsername: true,
        createdAt: true,
        avatarUrl: true,
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
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(tenantId: string, id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    return this.prisma.user.update({
      where: { id, tenantId },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        designation: true,
        isActive: true,
        githubUsername: true,
        avatarUrl: true,
      },
    });
  }

  async deactiveUser(tenantId: string, id: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!existing) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id, tenantId },
      data: { isActive: false },
    });
    return { message: 'User deactivated successfully' };
  }

  async reactivateUser(tenantId: string, id: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!existing) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id, tenantId },
      data: { isActive: true },
    });
    return { message: 'User reactivated successfully' };
  }
}

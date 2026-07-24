import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

   // NOTE: githubRepoUrl removed here. Repo linkage now lives on the
    // GitHubRepository model (Phase 3), connected via GitHubRepository.projectId,
    // not stored directly on Project. Revisit once the GitHub module is rebuilt.

  async create(tenantId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.project.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            features: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, tenantId },
      include: {
        members: {
          include: {
            member: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        features: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async update(tenantId: string, id: string, dto: UpdateProjectDto) {
    const existing = await this.prisma.project.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Project not found');
    return this.prisma.project.update({
      where: { id, tenantId },
      data: dto,
    });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.project.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Project not found');
    await this.prisma.project.delete({ where: { id, tenantId } });
    return { message: 'Project deleted successfully' };
  }

  async addMember(tenantId: string, projectId: string, memberId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, tenantId },
    });

    if (!member) throw new NotFoundException('User not found');
    const existingMember = await this.prisma.projectMember.findFirst({
      where: { projectId, memberId },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this project');
    }

    return this.prisma.projectMember.create({
      data: {
        projectId,
        memberId,
        tenantId
      },
      include: {
        member: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  async removeMember(tenantId: string, projectId: string, memberId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });

    if (!project) throw new NotFoundException('Project not found');

    const member = await this.prisma.projectMember.findFirst({
      where: { projectId, memberId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    await this.prisma.projectMember.delete({
      where: { id: member.id },
    });
    return { message: 'Member removed successfully' };
  }
}

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';
import { deriveProjectKey } from '../common/utils/issue-key';

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
        key: await this.allocateProjectKey(tenantId, dto.name),
      },
    });
  }

  /**
   * Issue keys (WEB-12) have to be unambiguous inside a workspace, so a second
   * project whose name derives to an existing key gets a numeric suffix
   * (WEB, WEB2, WEB3...) rather than silently sharing one.
   */
  private async allocateProjectKey(
    tenantId: string,
    name: string,
  ): Promise<string> {
    const base = deriveProjectKey(name);

    const taken = await this.prisma.project.findMany({
      where: { tenantId, key: { startsWith: base } },
      select: { key: true },
    });
    const used = new Set(taken.map((project) => project.key));

    if (!used.has(base)) return base;

    for (let suffix = 2; suffix < 100; suffix += 1) {
      const candidate = `${base}${suffix}`;
      if (!used.has(candidate)) return candidate;
    }

    return `${base}${Date.now().toString().slice(-4)}`;
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
        bugReports: {
          select: {
            id: true,
            title: true,
            status: true,
            severity: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        repositories: {
          select: {
            id: true,
            fullName: true,
            owner: true,
            name: true,
            isPrivate: true,
            webhookActive: true,
          },
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

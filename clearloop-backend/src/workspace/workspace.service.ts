import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  async getCurrent(tenantId: string) {
    const workspace = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    return workspace;
  }

  async update(tenantId: string, dto: UpdateWorkspaceDto) {
    const existing = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Workspace not found');
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: dto,
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getStats(tenantId: string) {
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      totalFeatures,
      totalBugReports,
      totalReleases,
      featuresByStatus,
      bugsByStatus,
    ] = await Promise.all([
      // Total users
      this.prisma.workspaceMember.count({
        where: { tenantId },
      }),
      // Active users
      this.prisma.workspaceMember.count({
        where: { tenantId, isActive: true },
      }),
      // Total projects
      this.prisma.project.count({
        where: { tenantId },
      }),
      // Total features
      this.prisma.feature.count({
        where: { tenantId },
      }),
      // Total bug reports
      this.prisma.bugReport.count({
        where: { tenantId },
      }),
      // Total releases
      this.prisma.release.count({
        where: { tenantId },
      }),
      // Features by status
      this.prisma.feature.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
      // Bugs by status
      this.prisma.bugReport.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      projects: {
        total: totalProjects,
      },
      features: {
        total: totalFeatures,
        byStatus: featuresByStatus.reduce(
          (acc, item) => {
            acc[item.status] = item._count;
            return acc;
          },
          {} as Record<string, number>,
        ),
      },
      bugs: {
        total: totalBugReports,
        byStatus: bugsByStatus.reduce(
          (acc, item) => {
            acc[item.status] = item._count;
            return acc;
          },
          {} as Record<string, number>,
        ),
      },
      releases: {
        total: totalReleases,
      },
    };
  }
}

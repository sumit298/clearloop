import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBugReportDto, UpdateBugReportDto } from './dto/bug-report.dto';

/**
 * Derives resolvedAt/closedAt from a status transition. These columns exist in
 * the schema but nothing wrote them, so "bugs resolved per week" had no source.
 *
 * Reopening a bug clears the stamps rather than leaving stale ones behind.
 */
function bugLifecycleStamps(
  existing: { status: string; resolvedAt: Date | null; closedAt: Date | null },
  nextStatus: string | undefined,
) {
  if (!nextStatus || nextStatus === existing.status) return {};

  const now = new Date();
  const stamps: { resolvedAt?: Date | null; closedAt?: Date | null } = {};
  const isSettled = nextStatus === 'RESOLVED' || nextStatus === 'CLOSED';

  if (isSettled) {
    stamps.resolvedAt = existing.resolvedAt ?? now;
  } else if (existing.resolvedAt) {
    stamps.resolvedAt = null;
  }

  if (nextStatus === 'CLOSED') {
    stamps.closedAt = existing.closedAt ?? now;
  } else if (existing.closedAt) {
    stamps.closedAt = null;
  }

  return stamps;
}

@Injectable()
export class BugReportsService {
  constructor(private prisma: PrismaService) {}

  // Resolves the effective projectId for a bug: when a feature is given, the
  // feature's project wins (a bug can't belong to a different project than
  // its own feature); otherwise projectId must be supplied directly, since
  // BugReport.projectId is how project-less bugs are avoided.
  private async resolveProjectId(
    tenantId: string,
    featureId?: string,
    projectId?: string,
  ): Promise<string> {
    if (featureId) {
      const feature = await this.prisma.feature.findFirst({
        where: { id: featureId, tenantId },
      });
      if (!feature) {
        throw new NotFoundException('Feature not found');
      }
      if (projectId && projectId !== feature.projectId) {
        throw new BadRequestException(
          'projectId does not match the project of the given feature',
        );
      }
      return feature.projectId;
    }

    if (!projectId) {
      throw new BadRequestException(
        'Either projectId or featureId is required',
      );
    }

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return projectId;
  }

  async createBugReport(
    tenantId: string,
    memberId: string,
    dto: CreateBugReportDto,
  ) {
    const projectId = await this.resolveProjectId(
      tenantId,
      dto.featureId,
      dto.projectId,
    );

    const bugReport = await this.prisma.$transaction(async (tx) => {
      const created = await tx.bugReport.create({
        data: {
          tenantId,
          reportedById: memberId,
          title: dto.title,
          description: dto.description,
          severity: dto.severity || 'MEDIUM',
          featureId: dto.featureId,
          projectId,
        },
        include: {
          feature: {
            select: {
              id: true,
              title: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          reportedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      if (dto.featureId) {
        await tx.activityLog.create({
          data: {
            tenantId,
            featureId: dto.featureId,
            memberId: memberId,
            action: 'BUG_REPORTED',
            metadata: {
              bugReportId: created.id,
              title: dto.title,
              severity: created.severity,
            },
          },
        });
      }
      return created;
    });

    return bugReport;
  }

  async findAll(tenantId: string, featureId?: string, projectId?: string) {
    return this.prisma.bugReport.findMany({
      where: {
        tenantId,
        ...(featureId && { featureId }),
        ...(projectId && { projectId }),
      },
      include: {
        feature: {
          select: {
            id: true,
            title: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          select: { id: true, content: true, createdAt: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const bugReport = await this.prisma.bugReport.findFirst({
      where: { id, tenantId },
      include: {
        feature: {
          select: {
            id: true,
            title: true,
            status: true,
            project: {
              select: { id: true, name: true },
            },
          },
        },
        project: {
          select: { id: true, name: true },
        },
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!bugReport) {
      throw new NotFoundException('Bug report not found');
    }

    return bugReport;
  }

  async update(
    tenantId: string,
    id: string,
    memberId: string,
    dto: UpdateBugReportDto,
  ) {
    const bugReport = await this.prisma.bugReport.findFirst({
      where: { id, tenantId },
    });

    if (!bugReport) {
      throw new NotFoundException('Bug Report not found');
    }

    // Only re-resolve projectId when featureId or projectId is actually
    // changing — otherwise leave the bug's existing project untouched.
    let projectId: string | undefined;
    if (dto.featureId !== undefined || dto.projectId !== undefined) {
      projectId = await this.resolveProjectId(
        tenantId,
        dto.featureId !== undefined ? dto.featureId : (bugReport.featureId ?? undefined),
        dto.projectId !== undefined ? dto.projectId : (bugReport.projectId ?? undefined),
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.bugReport.update({
        where: { id },
        data: {
          ...dto,
          ...(projectId !== undefined && { projectId }),
          ...bugLifecycleStamps(bugReport, dto.status),
        },
        include: {
          feature: {
            select: { id: true, title: true },
          },
          project: {
            select: { id: true, name: true },
          },
          reportedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (dto.status && bugReport.featureId) {
        await tx.activityLog.create({
          data: {
            tenantId,
            featureId: bugReport.featureId,
            memberId,
            action: 'BUG_STATUS_UPDATED',
            metadata: {
              bugReportId: bugReport.id,
              oldStatus: bugReport.status,
              newStatus: dto.status,
            },
          },
        });
      }

      return result;
    });

    return updated;
  }

  async remove(tenantId: string, id: string, userRole: string) {
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      throw new ForbiddenException(
        'Insufficient permissions to delete bug report',
      );
    }

    const bugReport = await this.prisma.bugReport.findFirst({
      where: { id, tenantId },
    });

    if (!bugReport) {
      throw new NotFoundException('Bug Report not found');
    }

    await this.prisma.bugReport.delete({
      where: { id },
    });

    return { message: 'Bug report deleted successfully' };
  }
}

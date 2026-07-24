import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBugReportDto, UpdateBugReportDto } from './dto/bug-report.dto';

@Injectable()
export class BugReportsService {
  constructor(private prisma: PrismaService) {}

  async createBugReport(
    tenantId: string,
    memberId: string,
    dto: CreateBugReportDto,
  ) {
    if (dto.featureId) {
      const feature = await this.prisma.feature.findFirst({
        where: { id: dto.featureId, tenantId },
      });
      if (!feature) {
        throw new NotFoundException('Feature not found');
      }
    }

    const bugReport = await this.prisma.$transaction(async (tx) => {
      const created = await tx.bugReport.create({
        data: {
          tenantId,
          reportedById: memberId,
          title: dto.title,
          description: dto.description,
          severity: dto.severity || 'MEDIUM',
          featureId: dto.featureId,
        },
        include: {
          feature: {
            select: {
              id: true,
              title: true,
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

  async findAll(tenantId: string, featureId?: string) {
    return this.prisma.bugReport.findMany({
      where: {
        tenantId,
        ...(featureId && { featureId }),
      },
      include: {
        feature: {
          select: {
            id: true,
            title: true,
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

    // verify feature exists if changing
    if (dto.featureId) {
      const feature = await this.prisma.feature.findFirst({
        where: { id: dto.featureId, tenantId },
      });

      if (!feature) {
        throw new NotFoundException('Feature not found');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.bugReport.update({
        where: { id },
        data: dto,
        include: {
          feature: {
            select: { id: true, title: true },
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

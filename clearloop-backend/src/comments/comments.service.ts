import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentsDto, UpdateCommentsDto } from './dto/comments.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: CreateCommentsDto) {
    // Must have either featureId or bugReportId
    if (!dto.featureId && !dto.bugReportId) {
      throw new ForbiddenException(
        'Comment must be linked to a feature or bug report',
      );
    }

    // Verify feature exists if provided
    if (dto.featureId) {
      const feature = await this.prisma.feature.findFirst({
        where: { id: dto.featureId, tenantId },
      });
      if (!feature) {
        throw new NotFoundException('Feature not found');
      }
    }

    // Verify bug report exists if provided
    if (dto.bugReportId) {
      const bugReport = await this.prisma.bugReport.findFirst({
        where: { id: dto.bugReportId, tenantId },
      });
      if (!bugReport) {
        throw new NotFoundException('Bug report not found');
      }
    }

    return this.prisma.comment.create({
      data: {
        tenantId,
        userId,
        content: dto.content,
        featureId: dto.featureId,
        bugReportId: dto.bugReportId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findByFeature(tenantId: string, featureId: string) {
    return this.prisma.comment.findMany({
      where: {
        tenantId,
        featureId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByBugReport(tenantId: string, bugReportId: string) {
    return this.prisma.comment.findMany({
      where: {
        tenantId,
        bugReportId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const comment = await this.prisma.comment.findFirst({
      where: { id, tenantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        feature: {
          select: { id: true, title: true },
        },
        bugReport: {
          select: { id: true, title: true },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async update(
    tenantId: string,
    id: string,
    userId: string,
    userRole: string,  // ADD THIS PARAMETER
    dto: UpdateCommentsDto,
  ) {
    const comment = await this.prisma.comment.findFirst({
      where: { id, tenantId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only comment owner or ADMIN can update
    if (comment.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.comment.update({
      where: { id },
      data: { content: dto.content },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async remove(tenantId: string, id: string, userId: string, userRole: string) {
    const comment = await this.prisma.comment.findFirst({
      where: { id, tenantId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only comment owner, ADMIN, or MANAGER can delete
    if (
      comment.userId !== userId &&
      userRole !== 'ADMIN' &&
      userRole !== 'MANAGER'
    ) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({
      where: { id },
    });

    return { message: 'Comment deleted successfully' };
  }
}

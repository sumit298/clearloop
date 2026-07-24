import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateFeatureDto,
  UpdateFeatureDto,
} from './dto/create-feature.dto';

@Injectable()
export class FeaturesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, memberId: string, dto: CreateFeatureDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, tenantId },
    });

    if (!project) throw new NotFoundException('Project not found');

    if (dto.assignedToId) {
      const assignee = await this.prisma.workspaceMember.findFirst({
        where: {
          id: dto.assignedToId,
          tenantId,
        },
      });
      if (!assignee) throw new NotFoundException('Assignee not found');
    }

    const feature = await this.prisma.feature.create({
      data: {
        ...dto,
        tenantId,
        createdById: memberId,
        status: 'PLANNED',
        priority: dto.priority || 'MEDIUM',
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });
    await this.prisma.activityLog.create({
      data: {
        tenantId,
        featureId: feature.id,
        memberId,
        action: 'FEATURE_CREATED',
        metadata: { title: feature.title },
      },
    });
    return feature;
  }

  async findAll(tenantId: string, projectId: string | undefined) {
    return this.prisma.feature.findMany({
      where: {
        tenantId,
        ...(projectId && { projectId }),
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        _count: {
          select: {
            pullRequests: true,
            bugReports: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const feature = await this.prisma.feature.findFirst({
      where: { id, tenantId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        pullRequests: {
          select: {
            id: true,
            title: true,
            status: true,
            githubPrUrl: true,
            author: true,
            createdAt: true,
          },
        },
        bugReports: {
          select: {
            id: true,
            title: true,
            severity: true,
            status: true,
            createdAt: true,
          },
        },
        comments: {
          include: {
            member: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        activityLogs: {
          include: {
            member: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!feature) throw new NotFoundException('Feature not found');
    return feature;
  }
  async update(tenantId: string, memberId: string, id: string, dto: UpdateFeatureDto){
    const existing = await this.prisma.feature.findFirst({
      where: {id, tenantId},
    })
    if(!existing){
      throw new NotFoundException("Feature not found");

    }

    if(dto.assignedToId){
      const assignee = await this.prisma.workspaceMember.findFirst({
        where: { id: dto.assignedToId, tenantId}
      })

      if(!assignee){ throw new NotFoundException("Assignee not found")}
    }

    const feature = await this.prisma.feature.update({
      where: { id },
      data: dto,
      include: {
        createdBy: { select: { id: true, name: true, email: true}},
        assignedTo: { select: { id: true, name: true, email: true}},
        project: { select: { id: true, name: true}}
      }
    });

    await this.prisma.activityLog.create({
      data: {
        tenantId,
        featureId: feature.id,
        memberId,
        action: 'FEATURE_UPDATED',
        metadata: JSON.parse(JSON.stringify(dto))

      },
    })
    return feature;
  }

  async remove(tenantId: string, memberId: string, id: string){
    const existing = await this.prisma.feature.findFirst({
      where: { id, tenantId},
    })

    if(!existing) throw new NotFoundException('Feature not found');

    await this.prisma.activityLog.create({
      data: {
        tenantId,
        featureId: id,
        memberId,
        action: 'FEATURE_DELETED',
        metadata: { title: existing.title },
      },
    });

    await this.prisma.feature.delete({
      where: { id }
    })
    return { message: "Feature deleted successfully"}
  }
}

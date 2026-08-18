import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from './ai.service';
import {
  CreateReleaseDto,
  UpdateReleaseDto,
  GenerateReleaseNotesDto,
} from './dto/release.dto';

@Injectable()
export class ReleaseService {
  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
  ) {}

  async create(tenantId: string, memberId: string, dto: CreateReleaseDto) {
    if (dto.featureIds && dto.featureIds.length > 0) {
      const uniqueFeatureIds = Array.from(new Set(dto.featureIds));
      const features = await this.prisma.feature.findMany({
        where: {
          id: { in: uniqueFeatureIds },
          tenantId,
        },
      });

      if (features.length !== uniqueFeatureIds.length) {
        throw new ForbiddenException('One or more features not found');
      }
    }
    let description = dto.description;

    if (dto.useAI && dto.featureIds && dto.featureIds.length > 0) {
      const prs = await this.prisma.pullRequest.findMany({
        where: {
          tenantId,
          featureId: { in: dto.featureIds },
          status: 'MERGED',
        },
        orderBy: { mergedAt: 'desc' },
        select: { title: true, aiSummary: true },
      });

      if (prs.length > 0) {
        const synthesized = await this.aiService.generateReleaseSummary(
          dto.title,
          prs,
        );
        description = synthesized || dto.description;
      }
    }
    const duplicate = await this.prisma.release.findFirst({
      where: { tenantId, version: dto.version },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException(
        `Version ${dto.version} already exists. Use a different version number.`,
      );
    }

    const release = await this.runReleaseWrite(dto.version, () =>
      this.prisma.$transaction(async (tx) => {
        const created = await tx.release.create({
          data: {
            tenantId,
            version: dto.version,
            title: dto.title,
            description: description || dto.description,
            releasedAt: dto.releasedAt ? new Date(dto.releasedAt) : new Date(),
          },
        });
        if (dto.featureIds && dto.featureIds.length) {
          await tx.releaseFeature.createMany({
            data: dto.featureIds.map((featureId) => ({
              tenantId,
              releaseId: created.id,
              featureId,
            })),
          });
        }
        return created;
      }),
    );
    return this.findOne(tenantId, release.id);
  }

  private async runReleaseWrite<T>(
    version: string | undefined,
    write: () => Promise<T>,
  ): Promise<T> {
    try {
      return await write();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Version ${version} already exists. Use a different version number.`,
        );
      }
      throw error;
    }
  }

  async findAll(tenantId: string) {
    return this.prisma.release.findMany({
      where: { tenantId },
      include: {
        features: {
          include: {
            feature: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { releasedAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const release = await this.prisma.release.findFirst({
      where: { id, tenantId },
      include: {
        features: {
          include: {
            feature: {
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                project: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!release) {
      throw new NotFoundException('Release not found');
    }

    return release;
  }

  async update(tenantId: string, id: string, dto: UpdateReleaseDto) {
    const release = await this.prisma.release.findFirst({
      where: { id, tenantId },
    });

    if (!release) {
      throw new NotFoundException('Release not found');
    }

    if (dto.version && dto.version !== release.version) {
      const duplicate = await this.prisma.release.findFirst({
        where: { tenantId, version: dto.version, id: { not: id } },
        select: { id: true },
      });

      if (duplicate) {
        throw new ConflictException(
          `Version ${dto.version} already exists. Use a different version number.`,
        );
      }
    }

    return this.runReleaseWrite(dto.version, () =>
      this.prisma.release.update({
        where: { id },
        data: {
          ...(dto.version && { version: dto.version }),
          ...(dto.title && { title: dto.title }),
          ...(dto.description && { description: dto.description }),
          ...(dto.releasedAt && { releasedAt: new Date(dto.releasedAt) }),
        },
        include: {
          features: {
            include: {
              feature: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
    );
  }

  async remove(tenantId: string, id: string, userRole: string) {
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      throw new ForbiddenException(
        'Insufficient permissions to delete release',
      );
    }

    const release = await this.prisma.release.findFirst({
      where: { id, tenantId },
    });

    if (!release) {
      throw new NotFoundException('Release not found');
    }

    await this.prisma.release.delete({
      where: { id },
    });

    return { message: 'Release deleted successfully' };
  }

  async addFeature(tenantId: string, releaseId: string, featureId: string) {
    const release = await this.prisma.release.findFirst({
      where: { id: releaseId, tenantId },
    });

    if (!release) {
      throw new NotFoundException('Release not found');
    }

    const feature = await this.prisma.feature.findFirst({
      where: { id: featureId, tenantId },
    });

    if (!feature) {
      throw new NotFoundException('Feature not found');
    }

    const existing = await this.prisma.releaseFeature.findFirst({
      where: { releaseId, featureId },
    });

    if (existing) {
      return { message: 'Feature already linked to release' };
    }

    await this.prisma.releaseFeature.create({
      data: { tenantId, releaseId, featureId },
    });

    return { message: 'Feature added to release successfully' };
  }

  async removeFeature(tenantId: string, releaseId: string, featureId: string) {
    const release = await this.prisma.release.findFirst({
      where: { id: releaseId, tenantId },
    });

    if (!release) {
      throw new NotFoundException('Release not found');
    }

    const releaseFeature = await this.prisma.releaseFeature.findFirst({
      where: { releaseId: releaseId, featureId: featureId },
    });

    if (!releaseFeature) {
      throw new NotFoundException('Feature is not linked to release');
    }

    await this.prisma.releaseFeature.delete({
      where: { id: releaseFeature.id },
    });

    return { message: 'Feature removed from release successfully' };
  }

  async generateReleaseNotes(tenantId: string, dto: GenerateReleaseNotesDto) {
    const sinceDate = dto.sinceDate ? new Date(dto.sinceDate) : new Date(0);
    const featureIds = dto.featureIds?.length
      ? Array.from(new Set(dto.featureIds))
      : undefined;

    if (featureIds) {
      const features = await this.prisma.feature.findMany({
        where: { id: { in: featureIds }, tenantId },
        select: { id: true },
      });

      if (features.length !== featureIds.length) {
        throw new ForbiddenException('One or more features not found');
      }
    }

    const prs = await this.prisma.pullRequest.findMany({
      where: {
        tenantId,
        status: 'MERGED',
        mergedAt: { gte: sinceDate },
        ...(featureIds && { featureId: { in: featureIds } }),
      },
      orderBy: { mergedAt: 'desc' },
      select: { title: true, aiSummary: true },
    });

    if (prs.length === 0) {
      return {
        notes: featureIds
          ? 'No merged PRs are linked to the selected features'
          : 'No merged PRs found for release notes generation',
      };
    }

    const synthesized = await this.aiService.generateReleaseSummary(
      dto.title?.trim() || 'this release',
      prs,
    );

    return {
      notes:
        synthesized || 'No AI summaries available for generating release notes',
    };
  }
}

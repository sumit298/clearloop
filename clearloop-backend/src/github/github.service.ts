import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GitHubWebhookDto } from './dto/github-webhook.dto';

@Injectable()
export class GithubService {
  constructor(private prisma: PrismaService) {}

  async handleWebhook(payload: GitHubWebhookDto) {
    const { action, pull_request, repository } = payload;

    if (!pull_request || !repository) {
      throw new BadRequestException('Invalid webhook payload');
    }

    const project = await this.prisma.project.findFirst({
      where: { githubRepoId: repository.id.toString() },
      include: { tenant: true },
    });

    if (!project) {
      console.log(`No Project found for repo: ${repository.full_name}`);
      return { message: 'Repository not linked to any project' };
    }

    const tenantId = project.tenantId;

    const featureId = this.extractFeatureId(
      pull_request.head.ref,
      pull_request.body,
    );

    switch (action) {
      case 'opened':
        return this.handlePROpened(
          tenantId,
          pull_request,
          repository,
          featureId,
        );
      case 'closed':
        return this.handlePRClosed(tenantId, pull_request, featureId);
      case 'reopened':
        return this.handlePRReopened(tenantId, pull_request, featureId);
      case 'synchronize':
        return this.handlePRSynchronize(tenantId, pull_request);
      default:
        return { message: `Unhandled action: ${action}` };
    }
  }

  /**
   * Handle PR opened - WITH TRANSACTION
   */
  private async handlePROpened(
    tenantId: string,
    pr: any,
    repo: any,
    featureId: string | null,
  ) {
    const existingPr = await this.prisma.pullRequest.findFirst({
      where: {
        tenantId,
        githubPrId: pr.id.toString(),
      },
    });

    if (existingPr) {
      return { message: 'PR already exists', pullRequestId: existingPr.id };
    }

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Create PR
      const pullRequest = await tx.pullRequest.create({
        data: {
          tenantId,
          githubPrId: pr.id.toString(),
          githubPrUrl: pr.html_url,
          title: pr.title,
          description: pr.body,
          author: pr.user.login,
          status: 'OPEN',
          featureId: featureId ?? undefined,
          createdAt: new Date(pr.created_at),
        },
      });

      // Update feature status if linked
      if (featureId) {
        const feature = await tx.feature.findFirst({
          where: { tenantId, id: featureId },
        });

        if (feature) {
          await tx.feature.update({
            where: { id: featureId },
            data: { status: 'IN_PROGRESS' },
          });

          // Log activity
          await tx.activityLog.create({
            data: {
              tenantId,
              featureId,
              userId: feature.createdById,
              action: 'FEATURE_STATUS_UPDATED_BY_PR',
              metadata: { 
                status: 'IN_PROGRESS', 
                source: 'github_webhook',
                prId: pullRequest.id,
                prUrl: pr.html_url,
              },
            },
          });
        }
      }

      return {
        message: 'PR created',
        pullRequestId: pullRequest.id,
        linkedToFeature: !!featureId,
      };
    });

    return result;
  }

  /**
   * Handle PR closed - WITH TRANSACTION
   */
  private async handlePRClosed(
    tenantId: string,
    pr: any,
    featureId: string | null,
  ) {
    const pullRequest = await this.prisma.pullRequest.findFirst({
      where: {
        tenantId,
        githubPrId: pr.id.toString(),
      },
    });

    if (!pullRequest) {
      throw new NotFoundException('PR not found');
    }

    const status = pr.merged ? 'MERGED' : 'CLOSED';

    // Use transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update PR status
      await tx.pullRequest.update({
        where: { id: pullRequest.id },
        data: {
          status,
          mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
        },
      });

      // Update feature status if PR was merged
      if (pr.merged && pullRequest.featureId) {
        const feature = await tx.feature.findFirst({
          where: { tenantId, id: pullRequest.featureId },
        });

        if (feature) {
          await tx.feature.update({
            where: { id: pullRequest.featureId },
            data: { status: 'IN_REVIEW' },
          });

          // Log activity
          await tx.activityLog.create({
            data: {
              tenantId,
              featureId: pullRequest.featureId,
              userId: feature.createdById,
              action: 'FEATURE_STATUS_UPDATED_BY_PR',
              metadata: { 
                status: 'IN_REVIEW', 
                source: 'github_webhook',
                prId: pullRequest.id,
                prUrl: pr.html_url,
                merged: true,
              },
            },
          });
        }
      }

      return {
        message: `PR ${status.toLowerCase()}`,
        pullRequestId: pullRequest.id,
      };
    });

    return result;
  }

  /**
   * Handle PR reopened - WITH TRANSACTION
   */
  private async handlePRReopened(
    tenantId: string,
    pr: any,
    featureId: string | null,
  ) {
    const pullRequest = await this.prisma.pullRequest.findFirst({
      where: {
        tenantId,
        githubPrId: pr.id.toString(),
      },
    });

    if (!pullRequest) {
      throw new NotFoundException('PR not found');
    }

    // Use transaction
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.pullRequest.update({
        where: { id: pullRequest.id },
        data: { status: 'OPEN' },
      });

      if (pullRequest.featureId) {
        const feature = await tx.feature.findFirst({
          where: { tenantId, id: pullRequest.featureId },
        });

        if (feature) {
          await tx.feature.update({
            where: { id: pullRequest.featureId },
            data: { status: 'IN_PROGRESS' },
          });

          await tx.activityLog.create({
            data: {
              tenantId,
              featureId: pullRequest.featureId,
              userId: feature.createdById,
              action: 'FEATURE_STATUS_UPDATED_BY_PR',
              metadata: { 
                status: 'IN_PROGRESS', 
                source: 'github_webhook',
                prId: pullRequest.id,
                prUrl: pr.html_url,
                reopened: true,
              },
            },
          });
        }
      }

      return {
        message: 'PR reopened',
        pullRequestId: pullRequest.id,
      };
    });

    return result;
  }

  /**
   * Handle PR synchronize (no transaction needed - single update)
   */
  private async handlePRSynchronize(tenantId: string, pr: any) {
    const pullRequest = await this.prisma.pullRequest.findFirst({
      where: {
        tenantId,
        githubPrId: pr.id.toString(),
      },
    });

    if (!pullRequest) {
      throw new NotFoundException('PR not found');
    }

    await this.prisma.pullRequest.update({
      where: { id: pullRequest.id },
      data: {
        title: pr.title,
        description: pr.body,
        updatedAt: new Date(pr.updated_at),
      },
    });

    return { message: 'PR updated', pullRequestId: pullRequest.id };
  }

  /**
   * Extract feature ID from branch name or PR body
   */
  private extractFeatureId(
    branchName: string,
    prBody: string | null,
  ): string | null {
    const branchPatterns = [
      /feature[\/\-]([a-f0-9-]{36})/i,
      /feat[\/\-]([a-f0-9-]{36})/i,
      /([a-f0-9-]{36})/i,
    ];

    for (const pattern of branchPatterns) {
      const match = branchName.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    if (prBody) {
      const bodyPatterns = [
        /closes\s+#([a-f0-9-]{36})/i,
        /fixes\s+#([a-f0-9-]{36})/i,
        /feature:\s*#?([a-f0-9-]{36})/i,
        /feature-id:\s*([a-f0-9-]{36})/i,
      ];

      for (const pattern of bodyPatterns) {
        const match = prBody.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
    }

    return null;
  }

  /**
   * Manually link PR to feature - WITH TRANSACTION
   */
  async linkPRToFeature(
    tenantId: string,
    pullRequestId: string,
    featureId: string,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const pr = await tx.pullRequest.findFirst({
        where: { tenantId, id: pullRequestId },
      });

      if (!pr) {
        throw new NotFoundException('Pull request not found');
      }

      const feature = await tx.feature.findFirst({
        where: { id: featureId, tenantId },
      });

      if (!feature) {
        throw new NotFoundException('Feature not found');
      }

      await tx.pullRequest.update({
        where: { id: pullRequestId },
        data: { featureId },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          tenantId,
          featureId,
          userId: feature.createdById,
          action: 'PR_MANUALLY_LINKED',
          metadata: { 
            prId: pullRequestId,
            prUrl: pr.githubPrUrl,
          },
        },
      });

      return { message: 'PR linked to feature successfully' };
    });

    return result;
  }

  /**
   * Unlink PR from feature - WITH TRANSACTION
   */
  async unlinkPRFromFeature(tenantId: string, pullRequestId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const pr = await tx.pullRequest.findFirst({
        where: { id: pullRequestId, tenantId },
      });

      if (!pr) {
        throw new NotFoundException('Pull request not found');
      }

      const oldFeatureId = pr.featureId;

      await tx.pullRequest.update({
        where: { id: pullRequestId },
        data: { featureId: null },
      });

      // Log activity if was linked
      if (oldFeatureId) {
        const feature = await tx.feature.findFirst({
          where: { id: oldFeatureId, tenantId },
        });

        if (feature) {
          await tx.activityLog.create({
            data: {
              tenantId,
              featureId: oldFeatureId,
              userId: feature.createdById,
              action: 'PR_MANUALLY_UNLINKED',
              metadata: { 
                prId: pullRequestId,
                prUrl: pr.githubPrUrl,
              },
            },
          });
        }
      }

      return { message: 'PR unlinked from feature successfully' };
    });

    return result;
  }

  /**
   * List all PRs for a tenant
   */
  async listPullRequests(tenantId: string, featureId?: string) {
    return this.prisma.pullRequest.findMany({
      where: {
        tenantId,
        ...(featureId && { featureId }),
      },
      include: {
        feature: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get PR details
   */
  async getPullRequest(tenantId: string, id: string) {
    const pr = await this.prisma.pullRequest.findFirst({
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
      },
    });

    if (!pr) {
      throw new NotFoundException('Pull request not found');
    }

    return pr;
  }
}

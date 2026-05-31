import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GitHubWebhookDto } from './dto/github-webhook.dto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class GithubService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  /**
   * Save GitHub App installation
   */
  async saveInstallation(tenantId: string, installationId: string) {
    // Store installation_id in tenant's projects
    // This will be updated when installation_repositories event fires
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        githubInstallationId: installationId,
      },
    });
    this.logger.log(
      `Installation ${installationId} saved for tenant ${tenantId}`,
      'GithubService',
    );
    return { message: 'Installation saved', installationId };
  }

  /**
   * Get GitHub installation status
   */
  async getInstallation(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { githubInstallationId: true },
    });

    if (tenant?.githubInstallationId) {
      return {
        connected: true,
        installationId: tenant.githubInstallationId,
        projects: [],
      };
    }
    const projects = await this.prisma.project.findMany({
      where: {
        tenantId,
        githubInstallationId: { not: null },
      },
      select: {
        id: true,
        name: true,
        githubRepoUrl: true,
        githubInstallationId: true,
      },
    });

    return {
      connected: projects.length > 0,
      installationId: projects[0]?.githubInstallationId || null,
      projects,
    };
  }

  /**
   * Disconnect GitHub App
   */
  async disconnectInstallation(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { githubInstallationId: true },
    });

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        githubInstallationId: null,
      },
    });

    await this.prisma.project.updateMany({
      where: { tenantId },
      data: {
        githubInstallationId: null,
        githubRepoId: null,
      },
    });

    return { message: 'GitHub App disconnected successfully' };
  }

  /**
   * Handle GitHub App installation events
   */
  async handleInstallationEvent(payload: any) {
    console.log('INSTALLATION PAYLOAD:', JSON.stringify(payload, null, 2));
    const { action, installation, repositories } = payload;
    const installationId = installation.id.toString();

    this.logger.log(
      `Installation event: ${action}, installation_id: ${installationId}`,
      'GithubService',
    );

    if (action === 'created' || action === 'added') {
      const repos = repositories || installation.repositories || [];
      const updatedTenants = new Set<string>();

      for (const repo of repos) {
        const repoFullName = repo.full_name;

        if (!repoFullName) {
          this.logger.warn(
            `Repository missing full_name: ${JSON.stringify(repo)}`,
            'GithubService',
          );
          continue;
        }

        const repoId = repo.id.toString();
        const repoUrl = `https://github.com/${repoFullName}`;

        this.logger.log(`Processing repo: ${repoUrl}`, 'GithubService');

        const project = await this.prisma.project.findFirst({
          where: { githubRepoUrl: repoUrl },
        });

        if (project) {
          // Update project with installation
          await this.prisma.project.update({
            where: { id: project.id },
            data: {
              githubInstallationId: installationId,
              githubRepoId: repoId,
            },
          });

          // Update only this tenant (multi-tenant safe)
          await this.prisma.tenant.update({
            where: { id: project.tenantId },
            data: { githubInstallationId: installationId },
          });

          updatedTenants.add(project.tenantId);

          this.logger.log(
            `Updated project ${project.name} (tenant: ${project.tenantId}) with installation`,
            'GithubService',
          );
        } else {
          this.logger.warn(
            `No project found for repo: ${repoUrl}`,
            'GithubService',
          );
        }
      }

      return {
        message: 'Installation processed successfully',
        tenantsUpdated: Array.from(updatedTenants),
      };
    }

    if (action === 'deleted') {
      // Find all projects with this installation
      const projectsWithInstallation = await this.prisma.project.findMany({
        where: { githubInstallationId: installationId },
        select: { id: true, tenantId: true },
      });

      // Collect affected tenants
      const affectedTenantIds = new Set(
        projectsWithInstallation.map((p) => p.tenantId),
      );

      // Update projects
      await this.prisma.project.updateMany({
        where: { githubInstallationId: installationId },
        data: {
          githubInstallationId: null,
          githubRepoId: null,
        },
      });

      if (projectsWithInstallation.length === 0) {
        this.logger.warn(
          `No projects found with installation ${installationId}`,
          'GithubService',
        );
        return { message: 'Installation removed successfully' };
      }

      // Update only affected tenants (multi-tenant safe)
      for (const tenantId of affectedTenantIds) {
        await this.prisma.tenant.update({
          where: { id: tenantId },
          data: { githubInstallationId: null },
        });
      }

      this.logger.log(
        `Installation ${installationId} removed from ${affectedTenantIds.size} tenant(s)`,
        'GithubService',
      );

      return { message: 'Installation removed successfully' };
    }

    return { message: `Installation event ${action} processed` };
  }

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
      this.logger.warn(
        `No Project found for repo: ${repository.full_name}`,
        'GithubService',
      );
      return { message: 'Repository not linked to any project' };
    }

    const tenantId = project.tenantId;

    const featureId = this.extractFeatureId(
      pull_request.head.ref,
      pull_request.body,
    );

    this.logger.log(
      `Webhook: ${action} PR #${pull_request.number} in ${repository.full_name}`,
      'GithubService',
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

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
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

  // ---------------------------------------------------------------------
  // Installation lifecycle
  // ---------------------------------------------------------------------

  // Called after GitHub redirects back post-install. The controller is
  // responsible for validating the signed GitHubInstallState nonce BEFORE
  // calling this — this method only persists, it doesn't authenticate the
  // callback. Upserts because GitHub can re-send an installation callback
  // for an installation that already exists (e.g. permissions updated).
  async saveInstallation(
    tenantId: string,
    githubInstallationId: string,
    accountId?: string,
    accountLogin?: string,
    accountType?: string,
  ) {
    const installation = await this.prisma.gitHubInstallation.upsert({
      where: { githubInstallationId },
      create: {
        tenantId,
        githubInstallationId,
        accountId,
        accountLogin,
        accountType,
        status: 'ACTIVE',
      },
      update: {
        status: 'ACTIVE',
        accountId,
        accountLogin,
        accountType,
        suspendedAt: null,
      },
    });

    this.logger.log(
      `Installation ${githubInstallationId} saved for tenant ${tenantId}`,
      'GithubService',
    );

    return { message: 'Installation saved', installation };
  }

  async getInstallation(tenantId: string) {
    const installations = await this.prisma.gitHubInstallation.findMany({
      where: { tenantId, status: 'ACTIVE' },
      include: {
        repositories: {
          select: {
            id: true,
            owner: true,
            name: true,
            fullName: true,
            projectId: true,
            webhookActive: true,
          },
        },
      },
    });

    return {
      connected: installations.length > 0,
      installations,
    };
  }

  async disconnectInstallation(tenantId: string, installationId: string) {
    const installation = await this.prisma.gitHubInstallation.findFirst({
      where: { id: installationId, tenantId },
    });

    if (!installation) {
      throw new NotFoundException('Installation not found');
    }

    // Unlink repositories from projects rather than deleting them outright —
    // preserves the PR/history data those repositories are tied to.
    await this.prisma.gitHubRepository.updateMany({
      where: { installationId: installation.id },
      data: { projectId: null, webhookActive: false },
    });

    await this.prisma.gitHubInstallation.update({
      where: { id: installation.id },
      data: { status: 'REMOVED' },
    });

    return { message: 'GitHub App disconnected successfully' };
  }

  // Explicit link step: attach an already-synced GitHubRepository to a
  // Project. This replaces the old "auto-match by URL on install" behavior —
  // that assumption broke once Project stopped storing a repo URL, and
  // making it explicit is also just more correct: a repo shouldn't silently
  // attach itself to whichever project happens to have a matching name.
  async connectRepositoryToProject(
    tenantId: string,
    repositoryId: string,
    projectId: string,
  ) {
    const repository = await this.prisma.gitHubRepository.findFirst({
      where: { id: repositoryId, tenantId },
    });
    if (!repository) throw new NotFoundException('Repository not found');

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.gitHubRepository.update({
      where: { id: repositoryId },
      data: { projectId, webhookActive: true },
    });
  }

  // ---------------------------------------------------------------------
  // Installation webhook events (repos added/removed from an installation)
  // ---------------------------------------------------------------------

  async handleInstallationEvent(payload: any) {
    const { action, installation, repositories } = payload;
    if (!installation?.id) {
      throw new BadRequestException('Invalid installation data');
    }
    const githubInstallationId = installation.id.toString();

    this.logger.log(
      `Installation event: ${action}, installation_id: ${githubInstallationId}`,
      'GithubService',
    );

    const installationRecord = await this.prisma.gitHubInstallation.findUnique({
      where: { githubInstallationId },
    });

    if (!installationRecord) {
      this.logger.warn(
        `Received event for unknown installation ${githubInstallationId}`,
        'GithubService',
      );
      return { message: 'Unknown installation, ignored' };
    }

    if (action === 'created' || action === 'added') {
      const repos = repositories || installation.repositories || [];
      const synced: string[] = [];

      for (const repo of repos) {
        if (!repo.full_name) {
          this.logger.warn(
            `Repository missing full_name: ${JSON.stringify(repo)}`,
            'GithubService',
          );
          continue;
        }

        await this.prisma.gitHubRepository.upsert({
          where: { githubRepoId: repo.id.toString() },
          create: {
            tenantId: installationRecord.tenantId,
            installationId: installationRecord.id,
            githubRepoId: repo.id.toString(),
            githubNodeId: repo.node_id,
            owner: repo.full_name.split('/')[0],
            name: repo.name,
            fullName: repo.full_name,
            isPrivate: !!repo.private,
            defaultBranch: repo.default_branch,
          },
          update: {
            fullName: repo.full_name,
            isPrivate: !!repo.private,
            defaultBranch: repo.default_branch,
          },
        });

        synced.push(repo.full_name);
        this.logger.log(`Synced repo: ${repo.full_name}`, 'GithubService');
      }

      return { message: 'Repositories synced', synced };
    }

    if (action === 'deleted') {
      await this.prisma.gitHubInstallation.update({
        where: { id: installationRecord.id },
        data: { status: 'REMOVED' },
      });

      await this.prisma.gitHubRepository.updateMany({
        where: { installationId: installationRecord.id },
        data: { projectId: null, webhookActive: false },
      });

      this.logger.log(
        `Installation ${githubInstallationId} removed`,
        'GithubService',
      );

      return { message: 'Installation removed successfully' };
    }

    return { message: `Installation event ${action} processed` };
  }

  // ---------------------------------------------------------------------
  // PR webhook handling — now idempotent via WebhookEvent
  // ---------------------------------------------------------------------

  async handleWebhook(
    deliveryId: string,
    eventType: string,
    payload: GitHubWebhookDto,
  ) {
    // Idempotency guard: GitHub retries webhook deliveries on timeout/error.
    // A previously-processed delivery is skipped entirely rather than
    // silently reprocessed (which could double-log activity or re-fire a
    // feature status transition).
    const existingEvent = await this.prisma.webhookEvent.findUnique({
      where: { deliveryId },
    });

    if (existingEvent) {
      if (existingEvent.status === 'PROCESSED') {
        return { message: 'Duplicate delivery, already processed' };
      }
      // A prior attempt exists but didn't finish (FAILED/RECEIVED) — fall
      // through and retry rather than skip.
    }

    const { action, pull_request, repository } = payload;

    if (!pull_request || !repository) {
      throw new BadRequestException('Invalid webhook payload');
    }

    const webhookEvent = await this.prisma.webhookEvent.upsert({
      where: { deliveryId },
      create: {
        deliveryId,
        eventType,
        action,
        status: 'PROCESSING',
        payload: payload as any,
      },
      update: { status: 'PROCESSING', attempts: { increment: 1 } },
    });

    const repoRecord = await this.prisma.gitHubRepository.findUnique({
      where: { githubRepoId: repository.id.toString() },
    });

    if (!repoRecord || !repoRecord.projectId) {
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: 'IGNORED', processedAt: new Date() },
      });
      this.logger.warn(
        `No project linked for repo: ${repository.full_name}`,
        'GithubService',
      );
      return { message: 'Repository not linked to any project' };
    }

    const tenantId = repoRecord.tenantId;

    try {
      const featureId = await this.extractFeatureId(
        tenantId,
        pull_request.head.ref,
        pull_request.body,
      );

      this.logger.log(
        `Webhook: ${action} PR #${pull_request.number} in ${repository.full_name}`,
        'GithubService',
      );

      let result: { message: string; pullRequestId?: string };

      switch (action) {
        case 'opened':
          result = await this.handlePROpened(
            tenantId,
            repoRecord.id,
            pull_request,
            featureId,
          );
          break;
        case 'closed':
          result = await this.handlePRClosed(tenantId, pull_request, featureId);
          break;
        case 'reopened':
          result = await this.handlePRReopened(tenantId, pull_request);
          break;
        case 'synchronize':
          result = await this.handlePRSynchronize(tenantId, pull_request);
          break;
        default:
          result = { message: `Unhandled action: ${action}` };
      }

      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
          repositoryId: repoRecord.id,
          pullRequestId: result.pullRequestId,
        },
      });

      return result;
    } catch (error) {
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  }

  private async handlePROpened(
    tenantId: string,
    repositoryId: string,
    pr: any,
    featureId: string | null,
  ) {
    const existingPr = await this.prisma.pullRequest.findUnique({
      where: { githubNodeId: pr.node_id },
    });

    if (existingPr) {
      return { message: 'PR already exists', pullRequestId: existingPr.id };
    }

    return this.prisma.$transaction(async (tx) => {
      const pullRequest = await tx.pullRequest.create({
        data: {
          tenantId,
          repositoryId,
          githubNodeId: pr.node_id,
          githubDatabaseId: pr.id.toString(),
          githubPrNumber: pr.number,
          githubPrUrl: pr.html_url,
          title: pr.title,
          description: pr.body,
          branchName: pr.head.ref,
          baseBranch: pr.base?.ref,
          headBranch: pr.head.ref,
          author: pr.user.login ?? "Unknown",
          authorGithubLogin: pr.user.login ?? 'Unknown',
          isDraft: !!pr.draft,
          status: 'OPEN',
          source: 'GITHUB',
          featureId: featureId ?? undefined,
          linkSource: featureId ? 'AUTO_BRANCH' : undefined,
          linkedAt: featureId ? new Date() : undefined,
          githubCreatedAt: new Date(pr.created_at),
        },
      });

      if (featureId) {
        const feature = await tx.feature.findFirst({
          where: { tenantId, id: featureId },
        });

        if (feature) {
          await tx.feature.update({
            where: { id: featureId },
            data: { status: 'IN_PROGRESS' },
          });

          await tx.activityLog.create({
            data: {
              tenantId,
              featureId,
              actorType: 'GITHUB',
              actorName: pr.user?.login,
              action: 'FEATURE_STATUS_UPDATED_BY_PR',
              metadata: {
                status: 'IN_PROGRESS',
                source: 'github_webhook',
                prId: pullRequest.id,
                prUrl: pr.html_url,
              },
              pullRequestId: pullRequest.id,
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
  }

  private async handlePRClosed(
    tenantId: string,
    pr: any,
    featureId: string | null,
  ) {
    const pullRequest = await this.prisma.pullRequest.findUnique({
      where: { githubNodeId: pr.node_id },
    });

    if (!pullRequest) {
      throw new NotFoundException('PR not found');
    }

    const status = pr.merged ? 'MERGED' : 'CLOSED';

    return this.prisma.$transaction(async (tx) => {
      await tx.pullRequest.update({
        where: { id: pullRequest.id },
        data: {
          status,
          mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
          closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
        },
      });

      // Rule: a merged PR advances its linked FEATURE to IN_REVIEW.
      // Resolving a linked BUG on merge is separate (Phase-3 follow-up, not
      // wired here yet) — keeping these independent avoids the "different
      // bug on the same feature gets closed" problem flagged earlier.
      if (pr.merged && pullRequest.featureId) {
        const feature = await tx.feature.findFirst({
          where: { tenantId, id: pullRequest.featureId },
        });

        if (feature) {
          await tx.feature.update({
            where: { id: pullRequest.featureId },
            data: { status: 'IN_REVIEW' },
          });

          await tx.activityLog.create({
            data: {
              tenantId,
              featureId: pullRequest.featureId,
              actorType: 'GITHUB',
              actorName: pr.user?.login,
              action: 'FEATURE_STATUS_UPDATED_BY_PR',
              metadata: {
                status: 'IN_REVIEW',
                source: 'github_webhook',
                prId: pullRequest.id,
                prUrl: pr.html_url,
                merged: true,
              },
              pullRequestId: pullRequest.id,
            },
          });
        }
      }

      return {
        message: `PR ${status.toLowerCase()}`,
        pullRequestId: pullRequest.id,
      };
    });
  }

  private async handlePRReopened(tenantId: string, pr: any) {
    const pullRequest = await this.prisma.pullRequest.findUnique({
      where: { githubNodeId: pr.node_id },
    });

    if (!pullRequest) {
      throw new NotFoundException('PR not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.pullRequest.update({
        where: { id: pullRequest.id },
        data: { status: 'OPEN', closedAt: null, mergedAt: null },
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
              actorType: 'GITHUB',
              actorName: pr.user?.login,
              action: 'FEATURE_STATUS_UPDATED_BY_PR',
              metadata: {
                status: 'IN_PROGRESS',
                source: 'github_webhook',
                prId: pullRequest.id,
                prUrl: pr.html_url,
                reopened: true,
              },
              pullRequestId: pullRequest.id,
            },
          });
        }
      }

      return { message: 'PR reopened', pullRequestId: pullRequest.id };
    });
  }

  private async handlePRSynchronize(tenantId: string, pr: any) {
    const pullRequest = await this.prisma.pullRequest.findUnique({
      where: { githubNodeId: pr.node_id },
    });

    if (!pullRequest) {
      throw new NotFoundException('PR not found');
    }

    await this.prisma.pullRequest.update({
      where: { id: pullRequest.id },
      data: {
        title: pr.title,
        description: pr.body,
      },
    });

    return { message: 'PR updated', pullRequestId: pullRequest.id };
  }

  // ---------------------------------------------------------------------
  // Branch/body → feature or bug resolution (logic unchanged from before —
  // only the DB calls needed to move; the matching strategy was already
  // solid)
  // ---------------------------------------------------------------------

  private async extractFeatureId(
    tenantId: string,
    branchName: string,
    prBody: string | null,
  ): Promise<string | null> {
    const bugMatch = branchName.match(/bug[\\/\-]([a-f0-9-]{36})/i);
    if (bugMatch) {
      const bugId = bugMatch[1];
      const bug = await this.prisma.bugReport.findFirst({
        where: { id: bugId, tenantId },
        select: { featureId: true },
      });
      if (bug?.featureId) {
        this.logger.log(
          `Bug ${bugId} linked to feature ${bug.featureId}`,
          'GithubService',
        );
        return bug.featureId;
      }
      this.logger.warn(
        `Bug ${bugId} not found or not linked to feature`,
        'GithubService',
      );
      return null;
    }

    const featurePatterns = [
      /feature[\\/\-]([a-f0-9-]{36})/i,
      /feat[\\/\-]([a-f0-9-]{36})/i,
    ];

    for (const pattern of featurePatterns) {
      const match = branchName.match(pattern);
      if (match && match[1]) {
        this.logger.log(
          `Detected feature branch: ${match[1]}`,
          'GithubService',
        );
        return match[1];
      }
    }

    if (prBody) {
      const bugBodyMatch = prBody.match(/bug:\s*#?([a-f0-9-]{36})/i);
      if (bugBodyMatch) {
        const bugId = bugBodyMatch[1];
        const bug = await this.prisma.bugReport.findFirst({
          where: { id: bugId, tenantId },
          select: { featureId: true },
        });
        return bug?.featureId ?? null;
      }

      const featureBodyMatch = prBody.match(/feature:\s*#?([a-f0-9-]{36})/i);
      if (featureBodyMatch) {
        return featureBodyMatch[1] ?? null;
      }

      const genericPatterns = [
        /closes\s+#([a-f0-9-]{36})/i,
        /fixes\s+#([a-f0-9-]{36})/i,
      ];
      for (const pattern of genericPatterns) {
        const match = prBody.match(pattern);
        if (match && match[1]) {
          const id = match[1];
          const bug = await this.prisma.bugReport.findFirst({
            where: { id, tenantId },
            select: { featureId: true },
          });
          return bug?.featureId ?? null;
        }
      }
    }

    this.logger.log('No feature ID detected', 'GithubService');
    return null;
  }

  // ---------------------------------------------------------------------
  // Manual link/unlink — now attributed to the acting member, not the
  // feature's original creator (that was a bug: the old code logged
  // feature.createdById as the actor regardless of who actually clicked
  // "link").
  // ---------------------------------------------------------------------

  async linkPRToFeature(
    tenantId: string,
    memberId: string,
    pullRequestId: string,
    featureId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const pr = await tx.pullRequest.findFirst({
        where: { tenantId, id: pullRequestId },
      });
      if (!pr) throw new NotFoundException('Pull request not found');

      const feature = await tx.feature.findFirst({
        where: { id: featureId, tenantId },
      });
      if (!feature) throw new NotFoundException('Feature not found');

      await tx.pullRequest.update({
        where: { id: pullRequestId },
        data: { featureId, linkSource: 'MANUAL', linkedAt: new Date() },
      });

      await tx.activityLog.create({
        data: {
          tenantId,
          featureId,
          memberId,
          actorType: 'USER',
          action: 'PR_MANUALLY_LINKED',
          metadata: { prId: pullRequestId, prUrl: pr.githubPrUrl },
          pullRequestId,
        },
      });

      return { message: 'PR linked to feature successfully' };
    });
  }

  async unlinkPRFromFeature(
    tenantId: string,
    memberId: string,
    pullRequestId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const pr = await tx.pullRequest.findFirst({
        where: { id: pullRequestId, tenantId },
      });
      if (!pr) throw new NotFoundException('Pull request not found');

      const oldFeatureId = pr.featureId;

      await tx.pullRequest.update({
        where: { id: pullRequestId },
        data: { featureId: null, linkSource: null, linkedAt: null },
      });

      if (oldFeatureId) {
        await tx.activityLog.create({
          data: {
            tenantId,
            featureId: oldFeatureId,
            memberId,
            actorType: 'USER',
            action: 'PR_MANUALLY_UNLINKED',
            metadata: { prId: pullRequestId, prUrl: pr.githubPrUrl },
            pullRequestId,
          },
        });
      }

      return { message: 'PR unlinked from feature successfully' };
    });
  }

  // ---------------------------------------------------------------------
  // Read endpoints
  // ---------------------------------------------------------------------

  async listPullRequests(tenantId: string, featureId?: string | null) {
    return this.prisma.pullRequest.findMany({
      where: {
        tenantId,
        ...(featureId && { featureId }),
      },
      include: {
        feature: { select: { id: true, title: true, status: true } },
        repository: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPullRequest(tenantId: string, id: string) {
    const pr = await this.prisma.pullRequest.findFirst({
      where: { id, tenantId },
      include: {
        feature: {
          select: {
            id: true,
            title: true,
            status: true,
            project: { select: { id: true, name: true } },
          },
        },
        repository: { select: { id: true, fullName: true } },
      },
    });

    if (!pr) {
      throw new NotFoundException('Pull request not found');
    }

    return pr;
  }
}

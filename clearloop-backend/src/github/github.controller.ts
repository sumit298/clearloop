import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
  Param,
  Req,
  Headers,
  BadRequestException,
  Res,
  Delete,
} from '@nestjs/common';
import { GithubService } from './github.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import type { GitHubWebhookDto } from './dto/github-webhook.dto';
import * as crypto from 'crypto';

@Controller('github')
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get GitHub App installation URL.
   *
   * The state param is now a random, server-stored nonce (GitHubInstallState)
   * instead of client-decodable base64 JSON. Previously anyone could decode
   * the old state, swap the tenantId, and re-encode it — nothing forced the
   * callback's tenantId to match who actually clicked "install". The nonce
   * closes that: the callback looks tenantId up from OUR database row, never
   * from anything the client (or GitHub, echoing the state back) supplies.
   */
  @Get('install-url')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getInstallUrl(@Request() req: AuthenticatedRequest) {
    const clientId = process.env.GITHUB_APP_CLIENT_ID;
    if (!clientId) {
      throw new BadRequestException('GitHub App not configured');
    }

    const installation = await this.githubService.getInstallation(req.tenantId);

    if (installation.connected && installation.installations[0]) {
      return {
        url: `https://github.com/settings/installations/${installation.installations[0].githubInstallationId}`,
        alreadyInstalled: true,
      };
    }

    const installState = await this.prisma.gitHubInstallState.create({
      data: {
        tenantId: req.tenantId,
        memberId: req.user.memberId,
        purpose: 'github_app_install',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

    const installUrl = `https://github.com/apps/${process.env.GITHUB_APP_NAME}/installations/new`;

    return {
      url: `${installUrl}?state=${installState.nonce}`,
      alreadyInstalled: false,
    };
  }

  /**
   * GitHub App installation callback. tenantId comes from the GitHubInstallState
   * row looked up by nonce — never decoded from anything the client sent.
   */
  @Get('install/callback')
  async installationCallback(
    @Query('installation_id') githubInstallationId: string,
    @Query('setup_action') setupAction: string,
    @Query('state') nonce: string,
    @Res() res,
  ) {
    const frontendUrl = process.env.FRONTEND_URL;

    try {
      const installState = await this.prisma.gitHubInstallState.findUnique({
        where: { nonce },
      });

      if (!installState) {
        throw new BadRequestException('Invalid or unknown install state');
      }
      if (installState.usedAt) {
        throw new BadRequestException('Install state already used');
      }
      if (installState.expiresAt < new Date()) {
        throw new BadRequestException('Install state expired');
      }

      await this.prisma.gitHubInstallState.update({
        where: { nonce },
        data: { usedAt: new Date() },
      });

      await this.githubService.saveInstallation(
        installState.tenantId,
        githubInstallationId,
      );

      return res.redirect(`${frontendUrl}/dashboard/settings?github=connected`);
    } catch (error) {
      console.error('GitHub callback failed:', error);
      return res.redirect(`${frontendUrl}/dashboard/settings?github=error`);
    }
  }

  @Get('installation')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getInstallation(@Request() req: AuthenticatedRequest) {
    return this.githubService.getInstallation(req.tenantId);
  }

  @Delete('installation/:id')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('ADMIN')
  async disconnectInstallation(
    @Request() req: AuthenticatedRequest,
    @Param('id') installationId: string,
  ) {
    return this.githubService.disconnectInstallation(
      req.tenantId,
      installationId,
    );
  }

  @Post(':id/connect-project')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  async connectRepositoryToProject(
    @Request() req: AuthenticatedRequest,
    @Param('id') repositoryId: string,
    @Body() body: { projectId: string },
  ) {
    return this.githubService.connectRepositoryToProject(
      req.tenantId,
      repositoryId,
      body.projectId,
    );
  }

  /**
   * GitHub webhook endpoint (no auth — verified by HMAC signature).
   */
  @Post('webhook')
  async handleWebHook(
    @Req() req: Request & { rawBody?: Buffer },
    @Body() payload: GitHubWebhookDto,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-event') event: string,
    @Headers('x-github-delivery') deliveryId: string,
  ) {
    if (process.env.GITHUB_WEBHOOK_SECRET) {
      this.verifyWebhookSignature(req.rawBody, signature);
    }

    if (!deliveryId) {
      throw new BadRequestException('Missing X-GitHub-Delivery header');
    }

    if (event === 'installation' || event === 'installation_repositories') {
      return this.githubService.handleInstallationEvent(payload);
    }

    if (event !== 'pull_request') {
      return { message: `Event ${event} ignored` };
    }

    return this.githubService.handleWebhook(deliveryId, event, payload);
  }

  @Get('pull-requests')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  listPullRequest(
    @Request() req: AuthenticatedRequest,
    @Query('featureId') featureId?: string,
  ) {
    return this.githubService.listPullRequests(req.tenantId, featureId);
  }

  @Get('pull-requests/:id')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  getPullRequest(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.githubService.getPullRequest(req.tenantId, id);
  }

  @Post('pull-requests/:id/link')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'DEVELOPER')
  async linkPullRequestToFeature(
    @Request() req: AuthenticatedRequest,
    @Param('id') pullRequestId: string,
    @Body() body: { featureId: string },
  ) {
    return this.githubService.linkPRToFeature(
      req.tenantId,
      req.user.memberId,
      pullRequestId,
      body.featureId,
    );
  }

  @Post('pull-requests/:id/unlink')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'DEVELOPER')
  async unlinkPullRequestFromFeature(
    @Request() req: AuthenticatedRequest,
    @Param('id') pullRequestId: string,
  ) {
    return this.githubService.unlinkPRFromFeature(
      req.tenantId,
      req.user.memberId,
      pullRequestId,
    );
  }

  private verifyWebhookSignature(
    rawBody: Buffer | undefined,
    signature: string,
  ) {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!secret) {
      console.log(
        '⚠️  Webhook signature verification skipped (no secret configured)',
      );
      return;
    }
    if (!signature) throw new BadRequestException('Missing signature');
    if (!rawBody) throw new BadRequestException('Missing request body');

    const hmac = crypto.createHmac('sha256', secret);
    const expectedSignature = 'sha256=' + hmac.update(rawBody).digest('hex');

    const sigBuffer = Buffer.from(signature, 'utf-8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');

    if (sigBuffer.length !== expectedBuffer.length) {
      throw new BadRequestException('Invalid signature');
    }
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      throw new BadRequestException('Invalid signature');
    }
  }
}

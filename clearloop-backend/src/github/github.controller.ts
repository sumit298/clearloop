import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
  Param,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { GithubService } from './github.service';
import type { GitHubWebhookDto } from './dto/github-webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import * as crypto from 'crypto';

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}
  /**
   * GitHub webhook endpoint (no auth - verified by signature)
   */
  @Post('webhook')
  async handleWebHook(
    @Body() payload: GitHubWebhookDto,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-event') event: string,
  ) {
    if (process.env.GITHUB_WEBHOOK_SECRET) {
      this.verifyWebhookSignature(JSON.stringify(payload), signature);
    }

    if (event !== 'pull_request') {
      return { message: `Event ${event} ignored` };
    }
    return this.githubService.handleWebhook(payload);
  }

  /**
   * List all pull requests
   */
  @Get('pull-requests')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  listPullRequest(
    @Request() req: AuthenticatedRequest,
    @Query('featureId') featureId?: string,
  ) {
    return this.githubService.listPullRequests(req.tenantId, featureId);
  }

  /**
   * Get pull request details
   */
  @Get('pull-requests/:id')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  getPullRequest(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.githubService.getPullRequest(req.tenantId, id);
  }

  /**
   * Manually link PR to feature
   */
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
      pullRequestId,
      body.featureId,
    );
  }

  /**
   * Manually unlink PR from feature
   */
  @Post('pull-requests/:id/unlink')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'DEVELOPER')
  async unlinkPullRequestFromFeature(
    @Request() req: AuthenticatedRequest,
    @Param('id') pullRequestId: string,
  ) {
    return this.githubService.unlinkPRFromFeature(req.tenantId, pullRequestId);
  }

  /**
   * Verify GitHub webhook signature
   */
  private verifyWebhookSignature(payload: string, signature: string) {
    if (!signature) {
      throw new BadRequestException('Missing signature');
    }

    const secret = process.env.GITHUB_WEBHOOK_SECRET!;
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    if (signature !== digest) {
      throw new BadRequestException('Invalid signature');
    }
  }
}

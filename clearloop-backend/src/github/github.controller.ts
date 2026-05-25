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
   * Get GitHub App installation URL
   * Returns the URL for the frontend to redirect to
   */
  @Get('install-url')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getInstallUrl(@Request() req: AuthenticatedRequest) {
    const clientId = process.env.GITHUB_APP_CLIENT_ID;
    
    if (!clientId) {
      throw new BadRequestException('GitHub App not configured');
    }
    
    // Store tenantId in state for callback
    const state = Buffer.from(
      JSON.stringify({ tenantId: req.tenantId }),
    ).toString('base64');
    
    // Use GitHub OAuth flow for app installation
    const installUrl = `https://github.com/apps/${process.env.GITHUB_APP_NAME}/installations/new`;
    
    return {
      url: `${installUrl}?state=${state}`,
    };
  }

  /**
   * GitHub App installation callback
   * Called after user installs the app
   */
  @Get('install/callback')
  async installationCallback(
    @Query('installation_id') installationId: string,
    @Query('setup_action') setupAction: string,
    @Query('state') state: string,
    @Res() res,
  ) {
    try {
      // Decode state to get tenantId
      const { tenantId } = JSON.parse(
        Buffer.from(state, 'base64').toString(),
      );
      
      // Store installation_id
      await this.githubService.saveInstallation(tenantId, installationId);
      
      // Redirect back to settings page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/dashboard/settings?github=connected`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/dashboard/settings?github=error`);
    }
  }

  /**
   * Get GitHub installation status
   */
  @Get('installation')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getInstallation(@Request() req: AuthenticatedRequest) {
    return this.githubService.getInstallation(req.tenantId);
  }

  /**
   * Disconnect GitHub App
   */
  @Delete('installation')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('ADMIN')
  async disconnectInstallation(@Request() req: AuthenticatedRequest) {
    return this.githubService.disconnectInstallation(req.tenantId);
  }

  /**
   * GitHub webhook endpoint (no auth - verified by signature)
   */
  @Post('webhook')
  async handleWebHook(
    @Req() req: Request & { rawBody?: Buffer },
    @Body() payload: any,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-event') event: string,
  ) {
    if (process.env.GITHUB_WEBHOOK_SECRET) {
      this.verifyWebhookSignature(req.rawBody, signature);
    }

    // Handle installation events
    if (event === 'installation' || event === 'installation_repositories') {
      return this.githubService.handleInstallationEvent(payload);
    }

    // Handle PR events
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
  private verifyWebhookSignature(rawBody: Buffer | undefined, signature: string) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  
  // If no secret configured, skip verification (dev mode)
  if (!secret) {
    console.log('⚠️  Webhook signature verification skipped (no secret configured)');
    return;
  }

  if (!signature) {
    throw new BadRequestException('Missing signature');
  }

  if (!rawBody) {
    throw new BadRequestException('Missing request body');
  }

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

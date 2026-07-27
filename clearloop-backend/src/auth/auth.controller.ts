import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Get,
  Req,
  Res,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.loginByEmail(dto);
  }

  // Google OAuth
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard handles redirect to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req, @Res() res) {
    try {
      const result = await this.authService.validateOAuthUser(
        req.user,
        'google',
      );
      const frontendUrl = this.configService.get('FRONTEND_URL');
      if (!frontendUrl) {
        throw new InternalServerErrorException(
          'FRONTEND_URL is not configured',
        );
      }
      if (
        'requiresWorkspaceSelection' in result &&
        result.requiresWorkspaceSelection
      ) {
        const workspaces = encodeURIComponent(
          JSON.stringify(result.workspaces),
        );
        const sessionToken = encodeURIComponent(result.sessionToken);
        res.redirect(
          `${frontendUrl}/auth/select-workspace?sessionToken=${sessionToken}&workspaces=${workspaces}`,
        );
        return;
      }

      // Single workspace - redirect with token
      if ('access_token' in result) {
        res.redirect(
          `${frontendUrl}/auth/callback?token=${result.access_token}`,
        );
      }
    } catch (error) {
      const frontendUrl =
        this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      res.redirect(
        `${frontendUrl}/auth/callback?error=${encodeURIComponent(error instanceof Error ? error.message : 'Authentication failed')}`,
      );
    }
  }

  // GitHub OAuth
  @Get('github')
  @UseGuards(GithubAuthGuard)
  async githubAuth() {
    // Guard handles redirect to GitHub
  }

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubAuthCallback(@Req() req, @Res() res) {
    try {
      const result = await this.authService.validateOAuthUser(
        req.user,
        'github',
      );
      const frontendUrl = this.configService.get('FRONTEND_URL');
      if (!frontendUrl) {
        throw new InternalServerErrorException(
          'FRONTEND_URL is not configured',
        );
      }

      if (
        'requiresWorkspaceSelection' in result &&
        result.requiresWorkspaceSelection
      ) {
        const workspaces = encodeURIComponent(
          JSON.stringify(result.workspaces),
        );
        const sessionToken = encodeURIComponent(result.sessionToken);
        res.redirect(
          `${frontendUrl}/auth/select-workspace?sessionToken=${sessionToken}&workspaces=${workspaces}`,
        );
        return;
      }

      // Single workspace - redirect with token
      if ('access_token' in result) {
        res.redirect(
          `${frontendUrl}/auth/callback?token=${result.access_token}`,
        );
      }
    } catch (error) {
      const frontendUrl =
        this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      res.redirect(
        `${frontendUrl}/auth/callback?error=${encodeURIComponent(error instanceof Error ? error.message : 'Authentication failed')}`,
      );
    }
  }

  @Post('select-workspace')
  async selectWorkspace(
    @Body() body: { sessionToken: string; workspaceId: string },
  ) {
    return this.authService.selectWorkspace(
      body.sessionToken,
      body.workspaceId,
    );
  }

  @Get('my-workspaces')
  @UseGuards(JwtAuthGuard)
  getMyWorkspaces(@Req() req: AuthenticatedRequest) {
    return this.authService.getMyWorkspaces(req.user.userId, req.user.tenantId);
  }

  @Post('switch-workspace')
  @UseGuards(JwtAuthGuard)
  switchWorkspace(
    @Req() req: AuthenticatedRequest,
    @Body() body: { tenantId: string },
  ) {
    return this.authService.switchWorkspace(req.user.userId, body.tenantId);
  }
}

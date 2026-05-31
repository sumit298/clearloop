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

  // Legacy endpoint - keep for backward compatibility
  @Post('login/:slug')
  loginBySlug(@Param('slug') slug: string, @Body() dto: LoginDto) {
    return this.authService.login(dto, slug);
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
        const email = encodeURIComponent(req.user.email);
        res.redirect(
          `${frontendUrl}/auth/select-workspace?email=${email}&workspaces=${workspaces}`,
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

      // Check if workspace selection is required
      if (
        'requiresWorkspaceSelection' in result &&
        result.requiresWorkspaceSelection
      ) {
        const workspaces = encodeURIComponent(
          JSON.stringify(result.workspaces),
        );
        const email = encodeURIComponent(req.user.email);
        res.redirect(
          `${frontendUrl}/auth/select-workspace?email=${email}&workspaces=${workspaces}`,
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
    @Body() body: { email: string; workspaceId: string; selectionToken: string },
  ) {
    return this.authService.selectWorkspace(
      body.email,
      body.workspaceId,
      body.selectionToken,
    );
  }

}

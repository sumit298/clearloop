import { Controller, Post, Body, Param, UseGuards, Get, Req, Res, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { ConfigService } from '@nestjs/config';




@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private configService: ConfigService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login/:slug')
  login(@Param('slug') slug: string, @Body() dto: LoginDto, ) {
    return this.authService.login(dto, slug);
  }

  // Google OAuth
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Query('tenant') tenant: string) {
    // Guard handles redirect to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req, @Res() res) {
    const result = await this.authService.validateOAuthUser(req.user, 'google');
    const frontendUrl = this.configService.get('FRONTEND_URL')!;
    const tenant = req.user.tenant;
    
    // Redirect to frontend with token
    res.redirect(`${frontendUrl}/${tenant}/auth/callback?token=${result.access_token}`);
  }

  // GitHub OAuth
  @Get('github')
  @UseGuards(GithubAuthGuard)
  async githubAuth(@Query('tenant') tenant: string) {
    // Guard handles redirect to GitHub
  }

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubAuthCallback(@Req() req, @Res() res) {
    const result = await this.authService.validateOAuthUser(req.user, 'github');
    const frontendUrl = this.configService.get('FRONTEND_URL')!;
    const tenant = req.user.tenant;
    
    // Redirect to frontend with token
    res.redirect(`${frontendUrl}/${tenant}/auth/callback?token=${result.access_token}`);
  }
}

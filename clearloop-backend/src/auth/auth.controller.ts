import { Controller, Post, Body, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { RegisterDto, LoginDto } from './dto/auth.dto';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Headers('x-tenant-slug') slug: string) {
    return this.authService.login(dto, slug);
  }
}

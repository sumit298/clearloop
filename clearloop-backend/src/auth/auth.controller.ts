import { Controller, Post, Body, Headers, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login/:slug')
  login(@Param('slug') slug: string, @Body() dto: LoginDto, ) {
    return this.authService.login(dto, slug);
  }
}

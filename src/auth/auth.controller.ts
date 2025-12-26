import { Controller, Request, Post, UseGuards, Body, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() req) {
    const user = await this.authService.validateUser(req.email, req.password);
    if (!user) {
        return { status: 'error', message: 'Invalid credentials' };
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() req) {
    return this.authService.register(req.email, req.password);
  }

  @Get('verify')
  async verify(@Query('token') token: string) {
      return this.authService.verify(token);
  }
}

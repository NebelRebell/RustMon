import { Body, Controller, Delete, Get, Param, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from './admin.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: { email: string; password: string }) {
    return this.authService.register(body.email, body.password);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.authService.login(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: any) {
    const { id, email, role } = req.user;
    return { id, email, role };
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll() {
    return this.authService.findAll();
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }
}

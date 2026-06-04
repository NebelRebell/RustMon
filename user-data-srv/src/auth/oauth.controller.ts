import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class OAuthController {
  constructor(private authService: AuthService) {}

  @Get('discord')
  @UseGuards(AuthGuard('discord'))
  discordLogin() {}

  @Get('discord/callback')
  @UseGuards(AuthGuard('discord'))
  async discordCallback(@Req() req: any, @Res() res: any) {
    try {
      const token = await this.authService.oauthLogin(req.user);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth/callback?token=${token}`);
    } catch (e) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth?error=discord_failed`);
    }
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: any) {
    try {
      const token = await this.authService.oauthLogin(req.user);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth/callback?token=${token}`);
    } catch (e) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth?error=google_failed`);
    }
  }

  @Get('steam')
  async steamLogin(@Res() res: any) {
    const returnUrl = `${process.env.API_URL || 'http://localhost:3000'}/auth/steam/callback`;
    const steamUrl = `https://steamcommunity.com/openid/login?openid.mode=checkid_setup&openid.ns=http://specs.openid.net/auth/2.0&openid.realm=${returnUrl}&openid.return_to=${returnUrl}&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select&openid.identity=http://specs.openid.net/auth/2.0/identifier_select`;
    res.redirect(steamUrl);
  }

  @Get('steam/callback')
  async steamCallback(@Req() req: any, @Res() res: any) {
    try {
      const params = req.query;
      const steamId = params['openid.claimed_id']?.split('/').pop();
      if (!steamId) return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth?error=steam_failed`);
      const token = await this.authService.oauthLogin({ provider: 'steam', id: steamId, email: `${steamId}@steam.local`, displayName: steamId });
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth/callback?token=${token}`);
    } catch (e) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth?error=steam_failed`);
    }
  }
}

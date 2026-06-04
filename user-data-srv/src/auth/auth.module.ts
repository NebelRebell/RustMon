import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { OAuthController } from './oauth.controller';
import { DiscordStrategy } from './discord.strategy';
import { GoogleStrategy } from './google.strategy';
import { CacheRedisService } from '../redis/redis.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'rustmon-dev-secret-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController, OAuthController],
  providers: [AuthService, JwtStrategy, CacheRedisService, DiscordStrategy, GoogleStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}

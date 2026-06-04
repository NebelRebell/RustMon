import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

// Only register strategy if credentials are provided
let StrategyBase: any;
try {
  if (DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET) {
    const { Strategy } = require('passport-discord');
    StrategyBase = Strategy;
  }
} catch (e) {
  // passport-discord not available
}

@Injectable()
export class DiscordStrategy {
  private readonly logger = new Logger(DiscordStrategy.name);
  private strategy: any = null;

  constructor() {
    if (StrategyBase && DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET) {
      try {
        this.strategy = new StrategyBase(
          {
            clientID: DISCORD_CLIENT_ID,
            clientSecret: DISCORD_CLIENT_SECRET,
            callbackURL: `${process.env.API_URL || 'http://localhost:3000'}/auth/discord/callback`,
            scope: ['identify', 'email'],
          },
          async (accessToken: string, refreshToken: string, profile: any, done: any) => {
            try {
              done(null, { provider: 'discord', id: profile.id, email: profile.email, displayName: profile.username });
            } catch (e) {
              done(e, null);
            }
          },
        );
      } catch (e) {
        this.logger.warn('Discord strategy init failed: ' + e.message);
      }
    } else {
      this.logger.log('Discord OAuth disabled (DISCORD_CLIENT_ID not set)');
    }
  }
}

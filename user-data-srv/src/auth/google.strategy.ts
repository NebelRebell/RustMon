import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

@Injectable()
export class GoogleStrategy {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor() {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      this.logger.log('Google OAuth disabled (GOOGLE_CLIENT_ID not set)');
    }
  }
}

import { Controller, Get, Post, Body } from '@nestjs/common';
import { CacheRedisService } from '../redis/redis.service';

/**
 * Discord outgoing message queue.
 * Frontend polls GET /discord/pending, executes via RCON, confirms with POST /discord/confirm.
 */
@Controller('discord')
export class DiscordQueueController {
  constructor(private readonly redis: CacheRedisService) {}

  /** Frontend polls this to get pending Discord→Rust messages */
  @Get('pending')
  async getPending() {
    try {
      const raw = await this.redis.getFromCache('discord_outgoing');
      const messages: any[] = raw ? JSON.parse(raw) : [];
      return messages;
    } catch {
      return [];
    }
  }

  /** Frontend confirms messages were sent via RCON */
  @Post('confirm')
  async confirm(@Body() body: { ids: string[] }) {
    try {
      const raw = await this.redis.getFromCache('discord_outgoing');
      let messages: any[] = raw ? JSON.parse(raw) : [];
      messages = messages.filter(m => !body.ids.includes(m.id));
      this.redis.saveInCache('discord_outgoing', 300, JSON.stringify(messages));
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }
}

import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { DiscordQueueController } from './discord-queue.controller';
import { CacheRedisService } from '../redis/redis.service';

@Module({
  controllers: [DiscordQueueController],
  providers: [DiscordService, CacheRedisService],
  exports: [DiscordService],
})
export class DiscordModule {}
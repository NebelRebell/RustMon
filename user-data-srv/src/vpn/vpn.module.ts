import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { VpnService } from './vpn.service';
import { VpnController } from './vpn.controller';
import { CacheRedisService } from '../redis/redis.service';

@Module({
  imports: [HttpModule],
  providers: [VpnService, CacheRedisService],
  controllers: [VpnController],
  exports: [VpnService],
})
export class VpnModule {}
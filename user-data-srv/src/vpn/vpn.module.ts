import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { VpnService } from './vpn.service';
import { VpnController } from './vpn.controller';

@Module({
  imports: [HttpModule],
  providers: [VpnService],
  controllers: [VpnController],
  exports: [VpnService],
})
export class VpnModule {}

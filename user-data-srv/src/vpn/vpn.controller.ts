import { Controller, Get, Param } from '@nestjs/common';
import { VpnService } from './vpn.service';

@Controller('player')
export class VpnController {
  constructor(private readonly vpnSvc: VpnService) {}

  @Get(':steamid/vpn-check')
  checkVpn(@Param('steamid') steamId: string) {
    return { steamId, note: 'Pass IP via query param ?ip=x.x.x.x for VPN check' };
  }

  @Get('vpn-check/ip/:ip')
  checkIp(@Param('ip') ip: string) {
    return this.vpnSvc.checkIp(ip);
  }
}

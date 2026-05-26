import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

export interface VpnCheckResult {
  ip: string;
  isVpn: boolean;
  isHosting: boolean;
  isProxy: boolean;
  checked: boolean;
  error?: string;
}

@Injectable()
export class VpnService {
  private readonly logger = new Logger(VpnService.name);
  private readonly enabled = process.env.VPN_CHECK_ENABLED !== 'false';

  constructor(private readonly http: HttpService) {}

  async checkIp(ip: string): Promise<VpnCheckResult> {
    if (!this.enabled) {
      return { ip, isVpn: false, isHosting: false, isProxy: false, checked: false };
    }
    if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return { ip, isVpn: false, isHosting: false, isProxy: false, checked: false };
    }
    try {
      const res = await firstValueFrom(
        this.http.get<any>(`http://ip-api.com/json/${ip}?fields=proxy,hosting,query`)
      );
      const data = res.data;
      return {
        ip: data.query || ip,
        isVpn: data.proxy || data.hosting,
        isHosting: data.hosting,
        isProxy: data.proxy,
        checked: true,
      };
    } catch (e) {
      this.logger.warn(`VPN check failed for ${ip}: ${e.message}`);
      return { ip, isVpn: false, isHosting: false, isProxy: false, checked: false, error: e.message };
    }
  }
}

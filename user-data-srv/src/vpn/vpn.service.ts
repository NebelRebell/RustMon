import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { CacheRedisService } from '../redis/redis.service';

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

  constructor(
    private readonly http: HttpService,
    @Optional() private readonly redis?: CacheRedisService,
  ) {}

  async checkIp(ip: string): Promise<VpnCheckResult> {
    if (!this.enabled) {
      return { ip, isVpn: false, isHosting: false, isProxy: false, checked: false };
    }
    if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return { ip, isVpn: false, isHosting: false, isProxy: false, checked: false };
    }

    // Check Redis cache first
    const cacheKey = `vpn:${ip}`;
    if (this.redis) {
      try {
        const cached = await this.redis.getFromCache(cacheKey, true);
        if (cached) return cached as VpnCheckResult;
      } catch {}
    }

    try {
      const res = await firstValueFrom(
        this.http.get<any>(`http://ip-api.com/json/${ip}?fields=proxy,hosting,query`)
      );
      const data = res.data;
      const result: VpnCheckResult = {
        ip: data.query || ip,
        isVpn: !!(data.proxy || data.hosting),
        isHosting: !!data.hosting,
        isProxy: !!data.proxy,
        checked: true,
      };
      // Cache for 1 hour
      if (this.redis) {
        try { this.redis.saveInCache(cacheKey, 3600, JSON.stringify(result)); } catch {}
      }
      return result;
    } catch (e) {
      this.logger.warn(`VPN check failed for ${ip}: ${e.message}`);
      return { ip, isVpn: false, isHosting: false, isProxy: false, checked: false, error: e.message };
    }
  }
}

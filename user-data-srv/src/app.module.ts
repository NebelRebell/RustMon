import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { ValveApiService } from './valve/valve-api.service';
import { IPGeocodeService } from './ipGeocode/ipgeocode.service';
import { CacheRedisService } from './redis/redis.service';
import { RustMapService } from './rustmap/rustmap.service';
import { UmodService } from './umod/umod.service';
import { BlacklistModule } from './blacklist/blacklist.module';
import { ScheduledCommandsModule } from './scheduled-commands/scheduled-commands.module';
import { VpnModule } from './vpn/vpn.module';
import { DiscordModule } from './discord/discord.module';
import { PterodactylModule } from './pterodactyl/pterodactyl.module';
import { environment } from './environment';

const apmImports: any[] = [];
if (environment.APM.enabled) {
  const { ApmModule } = require('@student-coin/elastic-apm-nest');
  apmImports.push(
    ApmModule.forRootAsync({
      useFactory: async () => ({
        httpUserMapFunction: (req: any) => ({
          id: req?.user?.id,
          username: req?.user?.username,
          email: req?.user?.email,
        }),
      }),
    })
  );
}

@Module({
  imports: [
    HttpModule,
    BlacklistModule,
    ScheduledCommandsModule,
    VpnModule,
    DiscordModule,
    PterodactylModule,
    ...apmImports,
  ],
  controllers: [AppController],
  providers: [ValveApiService, IPGeocodeService, CacheRedisService, RustMapService, UmodService],
})
export class AppModule {}

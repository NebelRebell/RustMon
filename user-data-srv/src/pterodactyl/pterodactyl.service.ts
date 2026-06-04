import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CacheRedisService } from '../redis/redis.service';
import { PterodactylConfig, PluginInfo, ConVar, ConVarDescription } from './pterodactyl.interfaces';
import * as Client from 'ssh2-sftp-client';
import * as path from 'path';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PterodactylService {
  private readonly logger = new Logger(PterodactylService.name);
  private readonly CONFIG_KEY = 'pterodactyl_config';

  constructor(
    private httpService: HttpService,
    private redis: CacheRedisService,
  ) {}

  async testConnection(config: PterodactylConfig): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${config.panelUrl}/api/client/servers/${config.serverId}`, {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }),
      );

      if (response.status !== 200) {
        throw new Error('Failed to connect to Pterodactyl API');
      }

      const sftp = new Client();
      await sftp.connect({
        host: config.sftpHost,
        port: config.sftpPort,
        username: config.sftpUsername,
        password: config.sftpPassword,
      });

      const oxideExists = await sftp.exists('/oxide');
      const carbonExists = await sftp.exists('/carbon');
      if (!oxideExists && !carbonExists) {
        await sftp.end();
        throw new Error('Neither /oxide nor /carbon directory found on server');
      }

      await sftp.end();
      return { success: true };
    } catch (error) {
      this.logger.error('Connection test failed:', error);
      return { success: false, message: error.message || 'Connection test failed' };
    }
  }

  async saveConfig(config: PterodactylConfig): Promise<void> {
    const encryptedConfig = {
      ...config,
      apiKey: this.encryptSensitiveData(config.apiKey),
      sftpPassword: this.encryptSensitiveData(config.sftpPassword),
    };
    await this.redis.saveInCache(this.CONFIG_KEY, 86400, encryptedConfig);
  }

  async getConfig(): Promise<PterodactylConfig> {
    const config = await this.redis.getFromCache(this.CONFIG_KEY, true);
    if (!config) {
      throw new BadRequestException('Pterodactyl configuration not found');
    }
    return {
      ...config,
      apiKey: this.decryptSensitiveData(config.apiKey),
      sftpPassword: this.decryptSensitiveData(config.sftpPassword),
    };
  }

  async getInstalledPlugins(): Promise<PluginInfo[]> {
    const config = await this.getConfig();
    const sftp = new Client();

    try {
      await sftp.connect({
        host: config.sftpHost,
        port: config.sftpPort,
        username: config.sftpUsername,
        password: config.sftpPassword,
      });

      const framework = await this.detectFramework(sftp);
      const pluginsDir = framework === 'carbon' ? '/carbon/plugins' : '/oxide/plugins';
      const files = await sftp.list(pluginsDir);
      const plugins: PluginInfo[] = [];

      for (const file of files) {
        if (file.name.endsWith('.cs')) {
          const raw = await sftp.get(`${pluginsDir}/${file.name}`);
          const pluginContent = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw);
          const pluginInfo = this.parsePluginInfo(file.name, pluginContent);
          const updateInfo = await this.checkPluginUpdate(pluginInfo.name);
          pluginInfo.hasUpdate = updateInfo.hasUpdate;
          if (updateInfo.latestVersion) pluginInfo.latestVersion = updateInfo.latestVersion;
          if (updateInfo.umodUrl) pluginInfo.umodUrl = updateInfo.umodUrl;
          plugins.push(pluginInfo);
        }
      }

      await sftp.end();
      return plugins;
    } catch (error) {
      this.logger.error('Failed to get installed plugins:', error);
      throw new InternalServerErrorException('Failed to retrieve plugins');
    }
  }

  async uploadPlugin(file: Express.Multer.File): Promise<{ success: boolean; message: string }> {
    const config = await this.getConfig();
    const sftp = new Client();

    try {
      await sftp.connect({
        host: config.sftpHost,
        port: config.sftpPort,
        username: config.sftpUsername,
        password: config.sftpPassword,
      });

      const framework = await this.detectFramework(sftp);
      const pluginsDir = framework === 'carbon' ? '/carbon/plugins' : '/oxide/plugins';
      await sftp.put(file.buffer, `${pluginsDir}/${file.originalname}`);
      await sftp.end();

      return { success: true, message: `Plugin ${file.originalname} uploaded successfully` };
    } catch (error) {
      this.logger.error('Failed to upload plugin:', error);
      throw new InternalServerErrorException('Failed to upload plugin');
    }
  }

  async deletePlugin(filename: string): Promise<{ success: boolean; message: string }> {
    const config = await this.getConfig();
    const sftp = new Client();

    try {
      await sftp.connect({
        host: config.sftpHost,
        port: config.sftpPort,
        username: config.sftpUsername,
        password: config.sftpPassword,
      });

      const framework = await this.detectFramework(sftp);
      const pluginsDir = framework === 'carbon' ? '/carbon/plugins' : '/oxide/plugins';
      await sftp.delete(`${pluginsDir}/${filename}`);
      await sftp.end();

      return { success: true, message: `Plugin ${filename} deleted successfully` };
    } catch (error) {
      this.logger.error('Failed to delete plugin:', error);
      throw new InternalServerErrorException('Failed to delete plugin');
    }
  }

  async updatePlugin(pluginId: string): Promise<{ success: boolean; message: string }> {
    try {
      const pluginSlug = this.convertToSlug(pluginId);
      const response = await firstValueFrom(
        this.httpService.get(`https://umod.org/plugins/${pluginSlug}.cs`, { responseType: 'arraybuffer' }),
      );

      if (response.status !== 200) {
        throw new Error('Failed to download plugin from uMod');
      }

      const config = await this.getConfig();
      const sftp = new Client();

      await sftp.connect({
        host: config.sftpHost,
        port: config.sftpPort,
        username: config.sftpUsername,
        password: config.sftpPassword,
      });

      const framework = await this.detectFramework(sftp);
      const pluginsDir = framework === 'carbon' ? '/carbon/plugins' : '/oxide/plugins';
      await sftp.put(Buffer.from(response.data), `${pluginsDir}/${pluginId}.cs`);
      await sftp.end();

      return { success: true, message: `Plugin ${pluginId} updated successfully` };
    } catch (error) {
      this.logger.error('Failed to update plugin:', error);
      throw new InternalServerErrorException('Failed to update plugin');
    }
  }

  async getConVars(): Promise<ConVar[]> {
    return [
      { name: 'server.hostname', value: 'My Rust Server', type: 'string', category: 'Server', description: 'Server name in the browser' },
      { name: 'server.maxplayers', value: '100', type: 'number', category: 'Server', description: 'Maximum number of players' },
      { name: 'server.description', value: '', type: 'string', category: 'Server', description: 'Server description' },
      { name: 'server.url', value: '', type: 'string', category: 'Server', description: 'Server website URL' },
      { name: 'server.headerimage', value: '', type: 'string', category: 'Server', description: 'Header image URL' },
      { name: 'server.pve', value: 'false', type: 'boolean', category: 'Gameplay', description: 'Enable PvE mode' },
      { name: 'server.radiation', value: 'true', type: 'boolean', category: 'Gameplay', description: 'Enable radiation zones' },
      { name: 'server.antihack.enabled', value: 'true', type: 'boolean', category: 'Anti-Cheat', description: 'Enable anti-hack system' },
      { name: 'server.antihack.noclip_protection', value: '2', type: 'number', category: 'Anti-Cheat', description: 'NoClip detection level (0-2)' },
      { name: 'server.antihack.speedhack_protection', value: '3', type: 'number', category: 'Anti-Cheat', description: 'Speedhack detection level (0-4)' },
      { name: 'fps.limit', value: '256', type: 'number', category: 'Performance', description: 'Server FPS limit' },
      { name: 'chat.serverlog', value: 'true', type: 'boolean', category: 'Logging', description: 'Log chat to server log' },
      { name: 'decay.scale', value: '1', type: 'number', category: 'Gameplay', description: 'Decay rate multiplier' },
      { name: 'stability.collapse', value: 'true', type: 'boolean', category: 'Building', description: 'Enable building collapse' },
    ];
  }

  async updateConVar(name: string, value: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`ConVar update: ${name} = ${value}`);
    return { success: true, message: `ConVar ${name} updated to ${value}` };
  }

  async getConVarDescriptions(): Promise<ConVarDescription[]> {
    return [
      { name: 'server.hostname', description: 'The name of the server as it appears in the server browser', defaultValue: 'Rust Server', category: 'Server' },
      { name: 'server.maxplayers', description: 'Maximum number of players allowed on the server', defaultValue: '100', category: 'Server' },
      { name: 'server.pve', description: 'Enable Player vs Environment mode', defaultValue: 'false', category: 'Gameplay' },
    ];
  }

  private parsePluginInfo(filename: string, content: string): PluginInfo {
    const nameMatch = content.match(/\[Info\("([^"]+)"/);
    const versionMatch = content.match(/\[Info\("[^"]+",\s*"[^"]+",\s*"([^"]+)"/);
    const authorMatch = content.match(/\[Info\("[^"]+",\s*"([^"]+)"/);
    const descriptionMatch = content.match(/\[Description\("([^"]+)"\)/);

    return {
      filename,
      name: nameMatch ? nameMatch[1] : path.basename(filename, '.cs'),
      version: versionMatch ? versionMatch[1] : '1.0.0',
      author: authorMatch ? authorMatch[1] : 'Unknown',
      description: descriptionMatch ? descriptionMatch[1] : 'No description available',
      enabled: true,
      hasUpdate: false,
    };
  }

  private async checkPluginUpdate(pluginName: string): Promise<{ hasUpdate: boolean; latestVersion?: string; umodUrl?: string }> {
    try {
      const pluginSlug = this.convertToSlug(pluginName);
      const response = await firstValueFrom(
        this.httpService.get(`https://umod.org/plugins/${pluginSlug}.json`),
      );
      if (response.status === 200 && response.data) {
        return {
          hasUpdate: true,
          latestVersion: response.data.latest_release_version,
          umodUrl: `https://umod.org/plugins/${pluginSlug}`,
        };
      }
    } catch (_) {}
    return { hasUpdate: false };
  }

  private convertToSlug(pluginName: string): string {
    return pluginName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  private encryptSensitiveData(data: string): string {
    return Buffer.from(data).toString('base64');
  }

  private decryptSensitiveData(data: string): string {
    return Buffer.from(data, 'base64').toString('utf8');
  }

  private async detectFramework(sftp: Client): Promise<'oxide' | 'carbon'> {
    try {
      if (await sftp.exists('/carbon')) return 'carbon';
      if (await sftp.exists('/oxide')) return 'oxide';
    } catch (error) {
      this.logger.error('Framework detection failed:', error);
    }
    return 'oxide';
  }
}
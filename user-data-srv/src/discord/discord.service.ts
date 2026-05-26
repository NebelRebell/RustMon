import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHAT_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const STATUS_CHANNEL_ID = process.env.DISCORD_STATUS_CHANNEL_ID;

@Injectable()
export class DiscordService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DiscordService.name);
  private client: any = null;
  private enabled = !!DISCORD_TOKEN;
  private statusInterval: NodeJS.Timeout | null = null;
  private serverStatusProvider?: () => Promise<{ players: number; fps: number; uptime: number; queued: number; hostname: string }>;
  private rconSend?: (cmd: string) => void;

  onModuleInit() {
    if (!this.enabled) {
      this.logger.log('Discord bot disabled (DISCORD_BOT_TOKEN not set)');
      return;
    }
    this.initBot().catch(e => this.logger.error('Discord init error: ' + e.message));
  }

  onModuleDestroy() {
    if (this.statusInterval) clearInterval(this.statusInterval);
    if (this.client) {
      try { this.client.destroy(); } catch (_) {}
    }
  }

  setServerStatusProvider(fn: typeof this.serverStatusProvider) {
    this.serverStatusProvider = fn;
  }

  setRconSender(fn: (cmd: string) => void) {
    this.rconSend = fn;
  }

  private async initBot() {
    try {
      const { Client, GatewayIntentBits, EmbedBuilder } = await import('discord.js');
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
        ],
      });

      this.client.once('ready', () => {
        this.logger.log(`Discord bot online as ${this.client.user.tag}`);
        this.startStatusUpdates(EmbedBuilder);
      });

      this.client.on('messageCreate', async (msg: any) => {
        try {
          if (msg.author.bot) return;
          if (CHAT_CHANNEL_ID && msg.channelId === CHAT_CHANNEL_ID) {
            if (this.rconSend) {
              this.rconSend(`say [Discord] ${msg.author.username}: ${msg.content}`);
            }
          }
          if (msg.content.startsWith('!linksteam ')) {
            const steamId = msg.content.replace('!linksteam ', '').trim();
            if (steamId && this.rconSend) {
              const group = process.env.DISCORD_OXIDE_GROUP || 'discord';
              this.rconSend(`oxide.usergroup add ${steamId} ${group}`);
              msg.reply(`Steam ID ${steamId} linked and added to group "${group}".`);
            }
          }
        } catch (e) {
          this.logger.error('Discord message handler error: ' + e.message);
        }
      });

      await this.client.login(DISCORD_TOKEN);
    } catch (e) {
      this.logger.error('Discord bot failed to start: ' + e.message);
    }
  }

  private startStatusUpdates(EmbedBuilder: any) {
    if (!STATUS_CHANNEL_ID || !this.serverStatusProvider) return;
    this.statusInterval = setInterval(async () => {
      try {
        const status = await this.serverStatusProvider();
        const channel = await this.client.channels.fetch(STATUS_CHANNEL_ID);
        if (!channel) return;
        const embed = new EmbedBuilder()
          .setTitle('Server Status')
          .setColor(0x00ae86)
          .addFields(
            { name: 'Server', value: status.hostname, inline: false },
            { name: 'Players', value: String(status.players), inline: true },
            { name: 'FPS', value: String(status.fps), inline: true },
            { name: 'Queued', value: String(status.queued), inline: true },
            { name: 'Uptime', value: `${Math.floor(status.uptime / 60)}m`, inline: true },
          )
          .setTimestamp();
        await channel.send({ embeds: [embed] });
      } catch (e) {
        this.logger.error('Discord status update error: ' + e.message);
      }
    }, 5 * 60 * 1000);
  }

  async sendChatMessage(serverMessage: string, username: string) {
    if (!this.enabled || !this.client || !CHAT_CHANNEL_ID) return;
    try {
      const channel = await this.client.channels.fetch(CHAT_CHANNEL_ID);
      if (channel) await channel.send(`**[Rust]** ${username}: ${serverMessage}`);
    } catch (e) {
      this.logger.error('Discord sendChat error: ' + e.message);
    }
  }
}

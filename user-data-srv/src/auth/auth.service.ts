import { Injectable, Logger, OnModuleInit, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { CacheRedisService } from '../redis/redis.service';
import { User, JwtPayload } from './auth.interfaces';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly redis: CacheRedisService,
  ) {}

  async onModuleInit() {
    try {
      const users = await this.findAll();
      if (users.length === 0) {
        const email = process.env.ADMIN_EMAIL || 'admin@rustmon.local';
        const password = process.env.ADMIN_PASSWORD || 'change-me-now';
        await this.register(email, password, 'admin');
        this.logger.log(`Default admin created: ${email}`);
      }
    } catch (e) {
      this.logger.warn('Could not check/create default admin: ' + e.message);
    }
  }

  async register(email: string, password: string, role: 'admin' | 'user' = 'user'): Promise<{ access_token: string; user: Partial<User> }> {
    const existingId = await this.redis.getFromCache(`user_email:${email}`);
    if (existingId) throw new ConflictException('Email already registered');

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 12);
    const user: User = { id, email, passwordHash, role, createdAt: new Date().toISOString() };

    await this.redis.saveInCache(`users:${id}`, 0, JSON.stringify(user));
    await this.redis.saveInCache(`user_email:${email}`, 0, id);

    const payload: JwtPayload = { sub: id, email, role };
    const access_token = this.jwtService.sign(payload);
    return { access_token, user: { id, email, role, createdAt: user.createdAt } };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const userId = await this.redis.getFromCache(`user_email:${email}`);
      if (!userId) return null;
      const raw = await this.redis.getFromCache(`users:${userId}`);
      if (!raw) return null;
      const user: User = JSON.parse(raw);
      const valid = await bcrypt.compare(password, user.passwordHash);
      return valid ? user : null;
    } catch {
      return null;
    }
  }

  async login(user: User): Promise<{ access_token: string; user: Partial<User> }> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt },
    };
  }

  async findById(id: string): Promise<User | null> {
    try {
      const raw = await this.redis.getFromCache(`users:${id}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }

  async findAll(): Promise<Partial<User>[]> {
    try {
      const keysRaw = await this.redis.getFromCache('user_ids');
      const ids: string[] = keysRaw ? JSON.parse(keysRaw) : [];
      const users: Partial<User>[] = [];
      for (const id of ids) {
        const raw = await this.redis.getFromCache(`users:${id}`);
        if (raw) {
          const u: User = JSON.parse(raw);
          users.push({ id: u.id, email: u.email, role: u.role, createdAt: u.createdAt });
        }
      }
      return users;
    } catch { return []; }
  }

  async deleteUser(id: string): Promise<void> {
    const raw = await this.redis.getFromCache(`users:${id}`);
    if (!raw) throw new NotFoundException('User not found');
    const user: User = JSON.parse(raw);
    this.redis.invalidate(`users:${id}`);
    this.redis.invalidate(`user_email:${user.email}`);
    try {
      const keysRaw = await this.redis.getFromCache('user_ids');
      const ids: string[] = keysRaw ? JSON.parse(keysRaw) : [];
      const updated = ids.filter(i => i !== id);
      await this.redis.saveInCache('user_ids', 0, JSON.stringify(updated));
    } catch {}
  }

  async oauthLogin(profile: { provider: string; id: string; email: string; displayName: string }): Promise<string> {
    try {
      const oauthKey = `oauth:${profile.provider}:${profile.id}`;
      let userId = await this.redis.getFromCache(oauthKey);
      if (!userId) {
        const email = profile.email || `${profile.id}@${profile.provider}.oauth`;
        const result = await this.register(email, Math.random().toString(36) + Math.random().toString(36));
        userId = result.user.id;
        await this.redis.saveInCache(oauthKey, 0, userId);
        // track user id
        const keysRaw = await this.redis.getFromCache('user_ids');
        const ids: string[] = keysRaw ? JSON.parse(keysRaw) : [];
        if (!ids.includes(userId)) {
          ids.push(userId);
          await this.redis.saveInCache('user_ids', 0, JSON.stringify(ids));
        }
      }
      const user = await this.findById(userId);
      if (!user) throw new Error('User not found after oauth login');
      const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
      return this.jwtService.sign(payload);
    } catch (e) {
      this.logger.error('oauthLogin error: ' + e.message);
      throw e;
    }
  }

  private async trackUserId(id: string) {
    try {
      const keysRaw = await this.redis.getFromCache('user_ids');
      const ids: string[] = keysRaw ? JSON.parse(keysRaw) : [];
      if (!ids.includes(id)) {
        ids.push(id);
        await this.redis.saveInCache('user_ids', 0, JSON.stringify(ids));
      }
    } catch {}
  }
}

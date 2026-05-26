import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as redis from 'redis';
import { Subject } from 'rxjs';
import { environment } from 'src/environment';

const crypto = require('crypto');

const MAX_RETRIES = 5;
const RETRY_BASE_MS = 1000;

@Injectable()
export class CacheRedisService implements OnModuleDestroy {

    private readonly logger = new Logger(CacheRedisService.name);
    private redisClient: redis.RedisClient;
    private onError: Subject<any> = new Subject<any>();
    private retryCount = 0;
    private isConnected = false;

    constructor() {
        this.connect();
    }

    private connect() {
        this.redisClient = redis.createClient({
            url: environment.redis.url,
            host: environment.redis.host,
            auth_pass: environment.redis.auth_pass || undefined,
            port: environment.redis.port,
            retry_strategy: (options) => {
                if (options.attempt > MAX_RETRIES) {
                    this.logger.error(`Redis connection failed after ${MAX_RETRIES} attempts. Cache unavailable — service continues without caching.`);
                    return undefined;
                }
                const delay = Math.min(RETRY_BASE_MS * Math.pow(2, options.attempt - 1), 30000);
                this.logger.warn(`Redis connection attempt ${options.attempt}/${MAX_RETRIES}, retrying in ${delay}ms...`);
                return delay;
            }
        });

        this.redisClient.on('connect', () => {
            this.isConnected = true;
            this.retryCount = 0;
            this.logger.log('Redis connected successfully');
        });

        this.redisClient.on('error', (err) => {
            this.isConnected = false;
            this.logger.error('Redis error: ' + err.message);
            this.onError.next(err);
        });

        this.redisClient.on('end', () => {
            this.isConnected = false;
            this.logger.warn('Redis connection closed');
        });
    }

    onModuleDestroy() {
        if (this.redisClient) {
            this.redisClient.quit();
        }
    }

    public getOnError(): Subject<any> {
        return this.onError;
    }

    public saveInCache(key: string, ttl: number, data: string | object): boolean {
        if (!this.isConnected) return false;
        if (typeof data == 'object') {
            data = JSON.stringify(data);
        }
        return this.redisClient.setex(key, ttl, data);
    }

    public getFromCache(key: string, asObject?: boolean): Promise<any> {
        if (!this.isConnected) return Promise.resolve(false);
        return new Promise<any>((res, rej) => {
            this.redisClient.get(key, (err, data) => {
                if (err) {
                    rej(err);
                } else {
                    if (data) {
                        if (asObject) {
                            try {
                                const _data = JSON.parse(data);
                                if (_data) data = _data;
                            } catch (e) {}
                        }
                        res(data);
                    } else {
                        res(false);
                    }
                }
            });
        });
    }

    public invalidate(key: string) {
        if (!this.isConnected) return 0;
        return this.redisClient.del(key);
    }

    public checksum(data: string) {
        return crypto.createHash('md5').update(data).digest('hex').toString();
    }

    public flushAll() {
        if (!this.isConnected) return;
        return this.redisClient.flushall();
    }
}

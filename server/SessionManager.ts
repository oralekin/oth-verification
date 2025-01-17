import redis from 'redis';
import connectRedis from 'connect-redis';
import session from 'express-session';
import consola from 'consola';
import { singleton } from "tsyringe";

@singleton()
export default class SessionProvider {
    private redisStore: connectRedis.RedisStore;
    private redisClient: redis.RedisClient;

    constructor() {
        this.redisStore = connectRedis(session);
        this.redisClient = redis.createClient({
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: parseInt(process.env.REDIS_PORT || '6379'),
        });
        this.connect()
    }
    private connect(): void {
        this.redisClient.on('error', err => {
            consola.error('Redis error: ', err);
        });
        this.redisClient.on('ready', () => {
            consola.ready('Redis initialised');
        })
    }
    public getStore(): connectRedis.RedisStore {
        return this.redisStore;
    }
    public getClient(): redis.RedisClient {
        return this.redisClient
    }
}

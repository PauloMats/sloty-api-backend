import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../queue/redis.service';
export declare class HealthService {
    private readonly prisma;
    private readonly redisService;
    constructor(prisma: PrismaService, redisService: RedisService);
    health(): Promise<{
        status: string;
        timestamp: string;
    }>;
    readiness(): Promise<{
        status: string;
        timestamp: string;
        checks: {
            database: string;
            redis: string;
        };
    }>;
}

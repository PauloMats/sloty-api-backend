import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../queue/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async readiness() {
    await this.prisma.$queryRaw`SELECT 1`;
    await this.redisService.ping();

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'up',
        redis: 'up',
      },
    };
  }
}

import { HealthService } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    getHealth(): Promise<{
        status: string;
        timestamp: string;
    }>;
    getReadiness(): Promise<{
        status: string;
        timestamp: string;
        checks: {
            database: string;
            redis: string;
        };
    }>;
}

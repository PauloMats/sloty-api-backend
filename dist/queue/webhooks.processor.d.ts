import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WebhooksService } from '../webhooks/webhooks.service';
interface WebhookJobPayload {
    webhookEventId: string;
}
export declare class WebhooksProcessor extends WorkerHost {
    private readonly webhooksService;
    constructor(webhooksService: WebhooksService);
    process(job: Job<WebhookJobPayload>): Promise<void>;
}
export {};

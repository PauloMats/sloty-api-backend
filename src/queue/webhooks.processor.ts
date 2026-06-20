import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WebhooksService } from '../webhooks/webhooks.service';

interface WebhookJobPayload {
  webhookEventId: string;
}

@Processor('webhooks')
export class WebhooksProcessor extends WorkerHost {
  constructor(private readonly webhooksService: WebhooksService) {
    super();
  }

  async process(job: Job<WebhookJobPayload>) {
    if (
      job.name === 'process-stripe-webhook' ||
      job.name === 'process-resend-webhook'
    ) {
      await this.webhooksService.processWebhook(job.data.webhookEventId);
    }
  }
}

import { AuthenticatedRequest } from '../common/types/request-context.type';
import { WebhooksService } from './webhooks.service';
export declare class WebhooksController {
    private readonly webhooksService;
    constructor(webhooksService: WebhooksService);
    stripe(request: AuthenticatedRequest, body: unknown): Promise<{
        received: boolean;
    }>;
    resend(request: AuthenticatedRequest, body: unknown): Promise<{
        received: boolean;
    }>;
}

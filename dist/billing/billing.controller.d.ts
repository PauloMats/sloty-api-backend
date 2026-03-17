import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { BillingService } from './billing.service';
import { CreateSubscriptionCheckoutDto } from './dto/billing.dto';
export declare class BillingController {
    private readonly billingService;
    constructor(billingService: BillingService);
    createCheckoutSession(user: AuthenticatedUser, dto: CreateSubscriptionCheckoutDto): Promise<{
        sessionId: string;
        url: string | null;
    }>;
    getMySubscription(user: AuthenticatedUser): Promise<{
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        businessId: string;
        stripeSubscriptionId: string;
        stripePriceId: string;
        currentPeriodStart: Date | null;
        currentPeriodEnd: Date | null;
        cancelAtPeriodEnd: boolean;
    } | null>;
}

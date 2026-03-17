import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailsService } from '../emails/emails.service';
interface ReminderJobPayload {
    appointmentId: string;
    template: 'appointment-reminder-24h' | 'appointment-reminder-2h';
}
export declare class RemindersProcessor extends WorkerHost {
    private readonly emailsService;
    constructor(emailsService: EmailsService);
    process(job: Job<ReminderJobPayload>): Promise<void>;
}
export {};

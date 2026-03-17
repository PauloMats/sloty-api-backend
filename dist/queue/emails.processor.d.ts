import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailsService, AppointmentEmailContext } from '../emails/emails.service';
export declare class EmailsProcessor extends WorkerHost {
    private readonly emailsService;
    constructor(emailsService: EmailsService);
    process(job: Job<AppointmentEmailContext>): Promise<void>;
}

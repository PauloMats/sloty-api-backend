import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  EmailsService,
  AppointmentEmailContext,
} from '../emails/emails.service';

@Processor('emails')
export class EmailsProcessor extends WorkerHost {
  constructor(private readonly emailsService: EmailsService) {
    super();
  }

  async process(job: Job<AppointmentEmailContext>) {
    if (job.name === 'send-appointment-email') {
      await this.emailsService.sendAppointmentEmail(job.data);
    }
  }
}

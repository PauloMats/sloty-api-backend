import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailsService } from '../emails/emails.service';

interface ReminderJobPayload {
  appointmentId: string;
  template: 'appointment-reminder-24h' | 'appointment-reminder-2h';
}

@Processor('reminders')
export class RemindersProcessor extends WorkerHost {
  constructor(private readonly emailsService: EmailsService) {
    super();
  }

  async process(job: Job<ReminderJobPayload>) {
    if (job.name === 'send-reminder') {
      await this.emailsService.sendReminder(
        job.data.appointmentId,
        job.data.template,
      );
    }
  }
}

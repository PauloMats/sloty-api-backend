import { Module } from '@nestjs/common';
import { EmailsProcessor } from '../queue/emails.processor';
import { RemindersProcessor } from '../queue/reminders.processor';
import { EmailsService } from './emails.service';

@Module({
  providers: [EmailsService, EmailsProcessor, RemindersProcessor],
  exports: [EmailsService],
})
export class EmailsModule {}

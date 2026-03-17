import { Module } from '@nestjs/common';
import { EmailsModule } from '../emails/emails.module';
import { AppointmentEventsListener } from './appointment-events.listener';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [EmailsModule],
  providers: [NotificationsService, AppointmentEventsListener],
  exports: [NotificationsService],
})
export class NotificationsModule {}

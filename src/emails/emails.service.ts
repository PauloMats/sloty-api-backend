import { InjectQueue } from '@nestjs/bullmq';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { DateTime } from 'luxon';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';
import {
  AppointmentEmailTemplate,
  renderAppointmentEmailTemplate,
} from './templates/appointment-email.templates';

function isResendPlaceholderKey(value?: string | null) {
  return !value || value === 're_test_key';
}

export interface AppointmentEmailContext {
  appointmentId: string;
  businessId?: string;
  userId?: string;
  toEmail: string;
  template: AppointmentEmailTemplate;
  businessName: string;
  serviceName: string;
  appointmentStartAt: string;
  appointmentEndAt: string;
  appointmentTimezone: string;
  clientName: string;
}

export interface ResendWebhookPayload {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[];
    from?: string;
    subject?: string;
  };
}

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private readonly resend: Resend | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @InjectQueue('emails') private readonly emailsQueue: Queue,
    @InjectQueue('reminders') private readonly remindersQueue: Queue,
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = isResendPlaceholderKey(apiKey) ? null : new Resend(apiKey);
  }

  async queueAppointmentEmail(payload: AppointmentEmailContext) {
    const jobId = `${payload.template}:${payload.appointmentId}:${payload.toEmail}`;
    await this.emailsQueue.add('send-appointment-email', payload, {
      jobId,
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }

  async scheduleAppointmentReminders(appointmentId: string, startAt: Date) {
    const reminderDefinitions = [
      { template: 'appointment-reminder-24h', offsetHours: 24 },
      { template: 'appointment-reminder-2h', offsetHours: 2 },
    ] as const;

    for (const reminder of reminderDefinitions) {
      const delay = DateTime.fromJSDate(startAt)
        .minus({ hours: reminder.offsetHours })
        .diffNow()
        .as('milliseconds');

      if (delay > 0) {
        await this.remindersQueue.add(
          'send-reminder',
          {
            appointmentId,
            template: reminder.template,
          },
          {
            delay,
            jobId: `${reminder.template}:${appointmentId}`,
            removeOnComplete: 100,
            removeOnFail: 100,
          },
        );
      }
    }
  }

  async sendAppointmentEmail(payload: AppointmentEmailContext) {
    const localStart = DateTime.fromISO(payload.appointmentStartAt, {
      zone: 'utc',
    })
      .setZone(payload.appointmentTimezone)
      .toFormat("dd/LL/yyyy 'as' HH:mm");
    const localEnd = DateTime.fromISO(payload.appointmentEndAt, { zone: 'utc' })
      .setZone(payload.appointmentTimezone)
      .toFormat("dd/LL/yyyy 'as' HH:mm");
    const template = renderAppointmentEmailTemplate(payload.template, {
      businessName: payload.businessName,
      serviceName: payload.serviceName,
      appointmentLocalStart: localStart,
      appointmentLocalEnd: localEnd,
      clientName: payload.clientName,
    });

    const nodeEnv = this.configService.get<string>('NODE_ENV');
    if (nodeEnv === 'test' || nodeEnv === 'development') {
      return this.prisma.emailLog.create({
        data: {
          businessId: payload.businessId,
          userId: payload.userId,
          appointmentId: payload.appointmentId,
          resendEmailId: `mock_${payload.appointmentId}_${payload.template}`,
          template: payload.template,
          toEmail: payload.toEmail,
          subject: template.subject,
          status: 'SENT',
        },
      });
    }

    if (!this.resend) {
      throw new ServiceUnavailableException({
        code: 'RESEND_NOT_CONFIGURED',
        message: 'Transactional email is not configured.',
      });
    }

    try {
      const response = await this.resend.emails.send({
        from: this.configService.getOrThrow<string>('RESEND_FROM_EMAIL'),
        to: payload.toEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      return this.prisma.emailLog.create({
        data: {
          businessId: payload.businessId,
          userId: payload.userId,
          appointmentId: payload.appointmentId,
          resendEmailId: response.data?.id ?? null,
          template: payload.template,
          toEmail: payload.toEmail,
          subject: template.subject,
          status: 'SENT',
        },
      });
    } catch (error) {
      this.logger.error(
        'Failed to send email.',
        error instanceof Error ? error.stack : undefined,
      );
      return this.prisma.emailLog.create({
        data: {
          businessId: payload.businessId,
          userId: payload.userId,
          appointmentId: payload.appointmentId,
          template: payload.template,
          toEmail: payload.toEmail,
          subject: template.subject,
          status: 'FAILED',
          errorMessage:
            error instanceof Error ? error.message : 'Unknown email error',
        },
      });
    }
  }

  async sendReminder(
    appointmentId: string,
    template: AppointmentEmailTemplate,
  ) {
    const appointment = await this.prisma.appointment.findUniqueOrThrow({
      where: { id: appointmentId },
      select: {
        id: true,
        businessId: true,
        clientId: true,
        startAt: true,
        endAt: true,
        business: {
          select: {
            name: true,
            timezone: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
        client: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return this.queueAppointmentEmail({
      appointmentId: appointment.id,
      businessId: appointment.businessId,
      userId: appointment.clientId,
      toEmail: appointment.client.email,
      template,
      businessName: appointment.business.name,
      serviceName: appointment.service.name,
      appointmentStartAt: appointment.startAt.toISOString(),
      appointmentEndAt: appointment.endAt.toISOString(),
      appointmentTimezone: appointment.business.timezone,
      clientName: appointment.client.name,
    });
  }

  async processResendWebhook(payload: ResendWebhookPayload) {
    const resendEmailId = payload.data?.email_id;
    if (!resendEmailId) {
      return;
    }

    await this.prisma.emailLog.updateMany({
      where: { resendEmailId },
      data: {
        status: payload.type.toUpperCase(),
      },
    });
  }
}

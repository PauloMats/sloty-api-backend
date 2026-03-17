import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentEmailTemplate } from './templates/appointment-email.templates';
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
export declare class EmailsService {
    private readonly prisma;
    private readonly configService;
    private readonly emailsQueue;
    private readonly remindersQueue;
    private readonly logger;
    private readonly resend;
    constructor(prisma: PrismaService, configService: ConfigService, emailsQueue: Queue, remindersQueue: Queue);
    queueAppointmentEmail(payload: AppointmentEmailContext): Promise<void>;
    scheduleAppointmentReminders(appointmentId: string, startAt: Date): Promise<void>;
    sendAppointmentEmail(payload: AppointmentEmailContext): Promise<{
        status: string;
        id: string;
        createdAt: Date;
        userId: string | null;
        businessId: string | null;
        appointmentId: string | null;
        resendEmailId: string | null;
        template: string;
        toEmail: string;
        subject: string;
        errorMessage: string | null;
    }>;
    sendReminder(appointmentId: string, template: AppointmentEmailTemplate): Promise<void>;
    processResendWebhook(payload: ResendWebhookPayload): Promise<void>;
}

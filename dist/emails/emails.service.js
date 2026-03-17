"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EmailsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailsService = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_2 = require("bullmq");
const luxon_1 = require("luxon");
const resend_1 = require("resend");
const prisma_service_1 = require("../prisma/prisma.service");
const appointment_email_templates_1 = require("./templates/appointment-email.templates");
function isResendPlaceholderKey(value) {
    return !value || value === 're_test_key';
}
let EmailsService = EmailsService_1 = class EmailsService {
    prisma;
    configService;
    emailsQueue;
    remindersQueue;
    logger = new common_1.Logger(EmailsService_1.name);
    resend;
    constructor(prisma, configService, emailsQueue, remindersQueue) {
        this.prisma = prisma;
        this.configService = configService;
        this.emailsQueue = emailsQueue;
        this.remindersQueue = remindersQueue;
        const apiKey = this.configService.get('RESEND_API_KEY');
        this.resend = isResendPlaceholderKey(apiKey) ? null : new resend_1.Resend(apiKey);
    }
    async queueAppointmentEmail(payload) {
        const jobId = `${payload.template}:${payload.appointmentId}:${payload.toEmail}`;
        await this.emailsQueue.add('send-appointment-email', payload, {
            jobId,
            removeOnComplete: 100,
            removeOnFail: 100,
        });
    }
    async scheduleAppointmentReminders(appointmentId, startAt) {
        const reminderDefinitions = [
            { template: 'appointment-reminder-24h', offsetHours: 24 },
            { template: 'appointment-reminder-2h', offsetHours: 2 },
        ];
        for (const reminder of reminderDefinitions) {
            const delay = luxon_1.DateTime.fromJSDate(startAt)
                .minus({ hours: reminder.offsetHours })
                .diffNow()
                .as('milliseconds');
            if (delay > 0) {
                await this.remindersQueue.add('send-reminder', {
                    appointmentId,
                    template: reminder.template,
                }, {
                    delay,
                    jobId: `${reminder.template}:${appointmentId}`,
                    removeOnComplete: 100,
                    removeOnFail: 100,
                });
            }
        }
    }
    async sendAppointmentEmail(payload) {
        const localStart = luxon_1.DateTime.fromISO(payload.appointmentStartAt, { zone: 'utc' })
            .setZone(payload.appointmentTimezone)
            .toFormat("dd/LL/yyyy 'as' HH:mm");
        const localEnd = luxon_1.DateTime.fromISO(payload.appointmentEndAt, { zone: 'utc' })
            .setZone(payload.appointmentTimezone)
            .toFormat("dd/LL/yyyy 'as' HH:mm");
        const template = (0, appointment_email_templates_1.renderAppointmentEmailTemplate)(payload.template, {
            businessName: payload.businessName,
            serviceName: payload.serviceName,
            appointmentLocalStart: localStart,
            appointmentLocalEnd: localEnd,
            clientName: payload.clientName,
        });
        if (!this.resend || this.configService.get('NODE_ENV') === 'test') {
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
        try {
            const response = await this.resend.emails.send({
                from: this.configService.getOrThrow('RESEND_FROM_EMAIL'),
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
        }
        catch (error) {
            this.logger.error('Failed to send email.', error instanceof Error ? error.stack : undefined);
            return this.prisma.emailLog.create({
                data: {
                    businessId: payload.businessId,
                    userId: payload.userId,
                    appointmentId: payload.appointmentId,
                    template: payload.template,
                    toEmail: payload.toEmail,
                    subject: template.subject,
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : 'Unknown email error',
                },
            });
        }
    }
    async sendReminder(appointmentId, template) {
        const appointment = await this.prisma.appointment.findUniqueOrThrow({
            where: { id: appointmentId },
            include: {
                business: true,
                service: true,
                client: true,
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
    async processResendWebhook(payload) {
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
};
exports.EmailsService = EmailsService;
exports.EmailsService = EmailsService = EmailsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)('emails')),
    __param(3, (0, bullmq_1.InjectQueue)('reminders')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        bullmq_2.Queue,
        bullmq_2.Queue])
], EmailsService);
//# sourceMappingURL=emails.service.js.map
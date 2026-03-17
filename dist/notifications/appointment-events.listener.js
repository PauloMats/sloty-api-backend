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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentEventsListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma/prisma.service");
const emails_service_1 = require("../emails/emails.service");
const notifications_service_1 = require("./notifications.service");
let AppointmentEventsListener = class AppointmentEventsListener {
    prisma;
    emailsService;
    notificationsService;
    constructor(prisma, emailsService, notificationsService) {
        this.prisma = prisma;
        this.emailsService = emailsService;
        this.notificationsService = notificationsService;
    }
    async onAppointmentCreated(event) {
        const appointment = await this.loadAppointment(event.appointmentId);
        const clientNotification = await this.notificationsService.createEmailNotification(appointment.clientId, 'appointment-created-client', { appointmentId: appointment.id });
        await this.emailsService.queueAppointmentEmail({
            appointmentId: appointment.id,
            businessId: appointment.businessId,
            userId: appointment.clientId,
            toEmail: appointment.client.email,
            template: 'appointment-created-client',
            businessName: appointment.business.name,
            serviceName: appointment.service.name,
            appointmentStartAt: appointment.startAt.toISOString(),
            appointmentEndAt: appointment.endAt.toISOString(),
            appointmentTimezone: appointment.business.timezone,
            clientName: appointment.client.name,
        });
        await this.notificationsService.markNotificationSent(clientNotification.id);
        if (appointment.business.email) {
            await this.emailsService.queueAppointmentEmail({
                appointmentId: appointment.id,
                businessId: appointment.businessId,
                toEmail: appointment.business.email,
                template: 'appointment-created-business',
                businessName: appointment.business.name,
                serviceName: appointment.service.name,
                appointmentStartAt: appointment.startAt.toISOString(),
                appointmentEndAt: appointment.endAt.toISOString(),
                appointmentTimezone: appointment.business.timezone,
                clientName: appointment.client.name,
            });
        }
        await this.emailsService.scheduleAppointmentReminders(appointment.id, appointment.startAt);
    }
    async onAppointmentConfirmed(event) {
        const appointment = await this.loadAppointment(event.appointmentId);
        const notification = await this.notificationsService.createEmailNotification(appointment.clientId, 'appointment-confirmed-client', { appointmentId: appointment.id });
        await this.emailsService.queueAppointmentEmail({
            appointmentId: appointment.id,
            businessId: appointment.businessId,
            userId: appointment.clientId,
            toEmail: appointment.client.email,
            template: 'appointment-confirmed-client',
            businessName: appointment.business.name,
            serviceName: appointment.service.name,
            appointmentStartAt: appointment.startAt.toISOString(),
            appointmentEndAt: appointment.endAt.toISOString(),
            appointmentTimezone: appointment.business.timezone,
            clientName: appointment.client.name,
        });
        await this.notificationsService.markNotificationSent(notification.id);
    }
    async onAppointmentCancelled(event) {
        const appointment = await this.loadAppointment(event.appointmentId);
        const notification = await this.notificationsService.createEmailNotification(appointment.clientId, 'appointment-cancelled-client', { appointmentId: appointment.id });
        await this.emailsService.queueAppointmentEmail({
            appointmentId: appointment.id,
            businessId: appointment.businessId,
            userId: appointment.clientId,
            toEmail: appointment.client.email,
            template: 'appointment-cancelled-client',
            businessName: appointment.business.name,
            serviceName: appointment.service.name,
            appointmentStartAt: appointment.startAt.toISOString(),
            appointmentEndAt: appointment.endAt.toISOString(),
            appointmentTimezone: appointment.business.timezone,
            clientName: appointment.client.name,
        });
        await this.notificationsService.markNotificationSent(notification.id);
    }
    loadAppointment(appointmentId) {
        return this.prisma.appointment.findUniqueOrThrow({
            where: { id: appointmentId },
            include: {
                business: true,
                service: true,
                client: true,
            },
        });
    }
};
exports.AppointmentEventsListener = AppointmentEventsListener;
__decorate([
    (0, event_emitter_1.OnEvent)('appointment.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppointmentEventsListener.prototype, "onAppointmentCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('appointment.confirmed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppointmentEventsListener.prototype, "onAppointmentConfirmed", null);
__decorate([
    (0, event_emitter_1.OnEvent)('appointment.cancelled'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppointmentEventsListener.prototype, "onAppointmentCancelled", null);
exports.AppointmentEventsListener = AppointmentEventsListener = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        emails_service_1.EmailsService,
        notifications_service_1.NotificationsService])
], AppointmentEventsListener);
//# sourceMappingURL=appointment-events.listener.js.map
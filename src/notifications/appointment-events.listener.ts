import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { EmailsService } from '../emails/emails.service';
import { NotificationsService } from './notifications.service';

interface AppointmentDomainEvent {
  appointmentId: string;
}

@Injectable()
export class AppointmentEventsListener {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailsService: EmailsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent('appointment.created')
  async onAppointmentCreated(event: AppointmentDomainEvent) {
    const appointment = await this.loadAppointment(event.appointmentId);
    const clientNotification =
      await this.notificationsService.createEmailNotification(
        appointment.clientId,
        'appointment-created-client',
        { appointmentId: appointment.id },
      );
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

    await this.emailsService.scheduleAppointmentReminders(
      appointment.id,
      appointment.startAt,
    );
  }

  @OnEvent('appointment.confirmed')
  async onAppointmentConfirmed(event: AppointmentDomainEvent) {
    const appointment = await this.loadAppointment(event.appointmentId);
    const notification =
      await this.notificationsService.createEmailNotification(
        appointment.clientId,
        'appointment-confirmed-client',
        { appointmentId: appointment.id },
      );
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

  @OnEvent('appointment.cancelled')
  async onAppointmentCancelled(event: AppointmentDomainEvent) {
    const appointment = await this.loadAppointment(event.appointmentId);
    const notification =
      await this.notificationsService.createEmailNotification(
        appointment.clientId,
        'appointment-cancelled-client',
        { appointmentId: appointment.id },
      );
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

  private loadAppointment(appointmentId: string) {
    return this.prisma.appointment.findUniqueOrThrow({
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
            email: true,
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
  }
}

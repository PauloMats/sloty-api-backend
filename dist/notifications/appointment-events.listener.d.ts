import { PrismaService } from '../prisma/prisma.service';
import { EmailsService } from '../emails/emails.service';
import { NotificationsService } from './notifications.service';
interface AppointmentDomainEvent {
    appointmentId: string;
}
export declare class AppointmentEventsListener {
    private readonly prisma;
    private readonly emailsService;
    private readonly notificationsService;
    constructor(prisma: PrismaService, emailsService: EmailsService, notificationsService: NotificationsService);
    onAppointmentCreated(event: AppointmentDomainEvent): Promise<void>;
    onAppointmentConfirmed(event: AppointmentDomainEvent): Promise<void>;
    onAppointmentCancelled(event: AppointmentDomainEvent): Promise<void>;
    private loadAppointment;
}
export {};

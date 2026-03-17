import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createEmailNotification(userId: string, template: string, payload: Record<string, unknown>): import("@prisma/client").Prisma.Prisma__NotificationClient<{
        status: import("@prisma/client").$Enums.NotificationStatus;
        id: string;
        createdAt: Date;
        userId: string;
        payload: import("@prisma/client/runtime/library").JsonValue;
        template: string;
        channel: import("@prisma/client").$Enums.NotificationChannel;
        sentAt: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    markNotificationSent(notificationId: string): Promise<{
        status: import("@prisma/client").$Enums.NotificationStatus;
        id: string;
        createdAt: Date;
        userId: string;
        payload: import("@prisma/client/runtime/library").JsonValue;
        template: string;
        channel: import("@prisma/client").$Enums.NotificationChannel;
        sentAt: Date | null;
    }>;
}

import { Injectable } from '@nestjs/common';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  createEmailNotification(
    userId: string,
    template: string,
    payload: Record<string, unknown>,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        channel: NotificationChannel.EMAIL,
        template,
        status: NotificationStatus.PENDING,
        payload: payload as never,
      },
    });
  }

  async markNotificationSent(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      },
    });
  }
}

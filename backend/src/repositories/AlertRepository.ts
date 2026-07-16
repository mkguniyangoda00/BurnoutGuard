import prisma from '../config/db';
import { Alert } from '../models/Alert';

type AlertType = 'Email' | 'Push' | 'InApp';
type AlertSeverity = 'Info' | 'Warning' | 'Critical';

export class AlertRepository {
  async create(data: {
    userId: string;
    predictionId?: string | null;
    alertType: AlertType;
    severity: AlertSeverity;
    message: string;
    sentAt: Date;
    createdBy: string;
    modifiedBy: string;
  }): Promise<Alert> {
    return prisma.alert.create({
      data: {
        ...data,
      },
    }) as unknown as Alert;
  }

  async findUnreadByUser(userId: string): Promise<Alert[]> {
    return prisma.alert.findMany({
      where: {
        userId,
        isRead: false,
        isDismissed: false,
      },
      orderBy: { sentAt: 'desc' },
    }) as unknown as Alert[];
  }

  async markRead(alertId: string, userId: string): Promise<Alert> {
    return prisma.alert.update({
      where: { alertId },
      data: {
        isRead: true,
        readAt: new Date(),
        modifiedBy: userId,
      },
    }) as unknown as Alert;
  }

  async dismiss(alertId: string, userId: string): Promise<Alert> {
    return prisma.alert.update({
      where: { alertId },
      data: {
        isDismissed: true,
        modifiedBy: userId,
      },
    }) as unknown as Alert;
  }
}

import { AlertType, AlertSeverity } from '@prisma/client';

export interface Alert {
  alertId: string;
  userId: string;
  predictionId: string | null;
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  isRead: boolean;
  readAt: Date | null;
  isDismissed: boolean;
  sentAt: Date;
  createdBy: string;
  createdDateTime: Date;
  modifiedBy: string;
  modifiedDate: Date;
}

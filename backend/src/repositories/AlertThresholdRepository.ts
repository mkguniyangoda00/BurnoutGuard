import prisma from '../config/db';
import { AlertThreshold } from '../models/AlertThreshold';

export class AlertThresholdRepository {
  private get table() {
    return (prisma as any).alertThreshold;
  }

  async findAll(): Promise<AlertThreshold[]> {
    return this.table.findMany({ orderBy: { thresholdKey: 'asc' } }) as unknown as AlertThreshold[];
  }

  async findByKey(thresholdKey: string): Promise<AlertThreshold | null> {
    return this.table.findUnique({ where: { thresholdKey } }) as unknown as AlertThreshold | null;
  }

  async create(data: AlertThreshold): Promise<AlertThreshold> {
    return this.table.create({ data }) as unknown as AlertThreshold;
  }

  async update(thresholdKey: string, data: Partial<Pick<AlertThreshold, 'value' | 'description'>>): Promise<AlertThreshold> {
    return this.table.update({
      where: { thresholdKey },
      data,
    }) as unknown as AlertThreshold;
  }

  async delete(thresholdKey: string): Promise<AlertThreshold> {
    return this.table.delete({ where: { thresholdKey } }) as unknown as AlertThreshold;
  }
}
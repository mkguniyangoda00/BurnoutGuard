import { AlertThresholdRepository } from '../repositories/AlertThresholdRepository';
import { AlertThreshold } from '../models/AlertThreshold';

export class AlertThresholdService {
  constructor(private thresholdRepo: AlertThresholdRepository) {}

  async getAll(): Promise<AlertThreshold[]> {
    return this.thresholdRepo.findAll();
  }

  async getByKey(thresholdKey: string): Promise<AlertThreshold | null> {
    return this.thresholdRepo.findByKey(thresholdKey);
  }

  async create(data: AlertThreshold): Promise<AlertThreshold> {
    const existing = await this.thresholdRepo.findByKey(data.thresholdKey);
    if (existing) {
      const err: any = new Error('Threshold already exists');
      err.statusCode = 400;
      throw err;
    }
    return this.thresholdRepo.create(data);
  }

  async update(thresholdKey: string, data: Partial<Pick<AlertThreshold, 'value' | 'description'>>): Promise<AlertThreshold> {
    return this.thresholdRepo.update(thresholdKey, data);
  }

  async delete(thresholdKey: string): Promise<AlertThreshold> {
    return this.thresholdRepo.delete(thresholdKey);
  }
}
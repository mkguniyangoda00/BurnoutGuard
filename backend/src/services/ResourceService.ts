import { ResourceRepository } from '../repositories/ResourceRepository';

export class ResourceService {
  constructor(private resourceRepo: ResourceRepository) {}

  async getActive() {
    return this.resourceRepo.findAllActive();
  }

  async getAll() {
    return this.resourceRepo.findAll();
  }

  async create(userId: string, dto: {
    title: string;
    category: string;
    description: string;
    contentUrl?: string;
  }) {
    return this.resourceRepo.create({
      ...dto,
      createdBy: userId,
      modifiedBy: userId,
    });
  }

  async update(resourceId: string, userId: string, dto: Partial<{
    title: string;
    category: string;
    description: string;
    contentUrl: string;
    isActive: boolean;
  }>) {
    const existing = await this.resourceRepo.findById(resourceId);
    if (!existing) {
      const err: any = new Error('Resource not found');
      err.statusCode = 404;
      throw err;
    }
    return this.resourceRepo.update(resourceId, dto, userId);
  }

  async delete(resourceId: string) {
    const existing = await this.resourceRepo.findById(resourceId);
    if (!existing) {
      const err: any = new Error('Resource not found');
      err.statusCode = 404;
      throw err;
    }
    return this.resourceRepo.delete(resourceId);
  }
}
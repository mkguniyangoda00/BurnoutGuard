import prisma from '../config/db';

export class ResourceRepository {
  async findAllActive() {
    return prisma.wellnessResource.findMany({
      where: { isActive: true },
      orderBy: { createdDateTime: 'desc' },
    });
  }

  async findAll() {
    return prisma.wellnessResource.findMany({
      orderBy: { createdDateTime: 'desc' },
    });
  }

  async findById(resourceId: string) {
    return prisma.wellnessResource.findUnique({ where: { resourceId } });
  }

  async create(data: {
    title: string;
    category: string;
    description: string;
    contentUrl?: string;
    createdBy: string;
    modifiedBy: string;
  }) {
    return prisma.wellnessResource.create({ data: data as any });
  }

  async update(resourceId: string, data: Partial<{
    title: string;
    category: string;
    description: string;
    contentUrl: string;
    isActive: boolean;
  }>, modifiedBy: string) {
    return prisma.wellnessResource.update({
      where: { resourceId },
      data: { ...data, modifiedBy } as any,
    });
  }

  async delete(resourceId: string) {
    return prisma.wellnessResource.delete({ where: { resourceId } });
  }
}
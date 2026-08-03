import prisma from '../config/db';

export class SurveyQuestionRepository {
  async findAllActive() {
    return prisma.surveyQuestion.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findAll() {
    return prisma.surveyQuestion.findMany({ orderBy: { displayOrder: 'asc' } });
  }

  async findById(questionId: string) {
    return prisma.surveyQuestion.findUnique({ where: { questionId } });
  }

  async create(data: {
    questionText: string;
    category: string;
    type: string;
    scaleMax?: number;
    displayOrder?: number;
    createdBy: string;
    modifiedBy: string;
  }) {
    return prisma.surveyQuestion.create({ data: data as any });
  }

  async update(questionId: string, data: Partial<{
    questionText: string;
    category: string;
    type: string;
    scaleMax: number;
    displayOrder: number;
    isActive: boolean;
  }>, modifiedBy: string) {
    return prisma.surveyQuestion.update({
      where: { questionId },
      data: { ...data, modifiedBy } as any,
    });
  }

  async delete(questionId: string) {
    return prisma.surveyQuestion.delete({ where: { questionId } });
  }
}
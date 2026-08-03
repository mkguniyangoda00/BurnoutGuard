import { SurveyQuestionRepository } from '../repositories/SurveyQuestionRepository';

export class SurveyQuestionService {
  constructor(private repo: SurveyQuestionRepository) {}

  async getActive() {
    return this.repo.findAllActive();
  }

  async getAll() {
    return this.repo.findAll();
  }

  async create(userId: string, dto: { questionText: string; category: string; type: string; scaleMax?: number; displayOrder?: number }) {
    return this.repo.create({ ...dto, createdBy: userId, modifiedBy: userId });
  }

  async update(questionId: string, userId: string, dto: Partial<{
    questionText: string; category: string; type: string; scaleMax: number; displayOrder: number; isActive: boolean;
  }>) {
    const existing = await this.repo.findById(questionId);
    if (!existing) {
      const err: any = new Error('Survey question not found');
      err.statusCode = 404;
      throw err;
    }
    return this.repo.update(questionId, dto, userId);
  }

  async delete(questionId: string) {
    const existing = await this.repo.findById(questionId);
    if (!existing) {
      const err: any = new Error('Survey question not found');
      err.statusCode = 404;
      throw err;
    }
    return this.repo.delete(questionId);
  }
}
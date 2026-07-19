import { ChatRepository } from '../repositories/ChatRepository';
import { PredictionRepository } from '../repositories/PredictionRepository';
import { ChatMessage } from '../models/ChatMessage';
import { ShapExplanation } from '../models/ShapExplanation';

export class ChatService {
  constructor(
    private chatRepo: ChatRepository,
    private predictionRepo: PredictionRepository
  ) {}

  private async getLatestPredictionContext(userId: string) {
    const prediction = await this.predictionRepo.findLatestByUser(userId);
    const topShapRows = prediction?.shapExplanations
      ? [...prediction.shapExplanations].sort((a, b) => a.importanceRank - b.importanceRank).slice(0, 3)
      : [];

    return { prediction, topShapRows };
  }

  private formatTopFactors(shapRows: ShapExplanation[]) {
    if (shapRows.length === 0) {
      return 'I do not have enough prediction detail yet to personalize this response.';
    }

    const factors = shapRows.map((row) => row.featureName.replace(/([A-Z])/g, ' $1').toLowerCase());
    return `Your current prediction is most influenced by ${factors.join(', ')}.`;
  }

  private buildCannedReply(content: string, context: { prediction: { riskLevel: string; riskScore: number } | null; topShapRows: ShapExplanation[] }) {
    const normalized = content.toLowerCase();
    const hasPrediction = !!context.prediction;

    if (/(hello|hi|hey|good morning|good afternoon|good evening)/.test(normalized)) {
      return hasPrediction
        ? `Hello. Your latest burnout risk is ${context.prediction!.riskLevel} at ${(context.prediction!.riskScore * 100).toFixed(0)}%. ${this.formatTopFactors(context.topShapRows)}`
        : 'Hello. Complete a check-in first and I can personalize your burnout guidance with your latest prediction.';
    }

    if (/(what.?if|what if|simulate|simulation)/.test(normalized)) {
      return 'Use the What-If Simulator to see how changing sleep, work hours, or other habits affects your predicted burnout risk.';
    }

    if (/(recommend|advice|suggest|help me|action plan)/.test(normalized)) {
      return hasPrediction
        ? `Based on your current data, I would focus on the top drivers behind your ${context.prediction!.riskLevel.toLowerCase()} risk. ${this.formatTopFactors(context.topShapRows)}`
        : 'I can generate more specific recommendations after you submit a check-in and a prediction is available.';
    }

    if (/(risk|score|prediction|burnout)/.test(normalized)) {
      return hasPrediction
        ? `Your latest burnout risk is ${context.prediction!.riskLevel} with a score of ${(context.prediction!.riskScore * 100).toFixed(0)}%. ${this.formatTopFactors(context.topShapRows)}`
        : 'No prediction is available yet. Submit a check-in to generate your first risk score.';
    }

    if (/(sleep|rest|tired)/.test(normalized)) {
      return hasPrediction
        ? `Sleep is one of the biggest factors in your current profile. ${this.formatTopFactors(context.topShapRows)}`
        : 'Sleep quality matters a lot for burnout risk. Once you have a prediction, I can tailor advice to your data.';
    }

    if (/(stress|overwhelm|pressure)/.test(normalized)) {
      return 'When stress is high, reduce load where possible, take short breaks, and use the What-If Simulator to test lower-workload scenarios.';
    }

    return hasPrediction
      ? `I can help with burnout risk, recommendations, sleep, stress, or what-if scenarios. Your current risk is ${context.prediction!.riskLevel}. ${this.formatTopFactors(context.topShapRows)}`
      : 'I can help with burnout risk, recommendations, sleep, stress, or what-if scenarios. Submit a check-in first so I can personalize my guidance.';
  }

  async getHistory(userId: string): Promise<ChatMessage[]> {
    return this.chatRepo.findByUserId(userId);
  }

  async sendMessage(userId: string, content: string): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage; messages: ChatMessage[] }> {
    const { prediction, topShapRows } = await this.getLatestPredictionContext(userId);

    const userMessage = await this.chatRepo.create({
      userId,
      role: 'user',
      content,
      relatedPredictionId: prediction?.predictionId ?? null,
      createdBy: userId,
      modifiedBy: userId,
    });

    const replyContent = this.buildCannedReply(content, {
      prediction: prediction ? { riskLevel: prediction.riskLevel, riskScore: prediction.riskScore } : null,
      topShapRows,
    });

    const assistantMessage = await this.chatRepo.create({
      userId,
      role: 'assistant',
      content: replyContent,
      relatedPredictionId: prediction?.predictionId ?? null,
      createdBy: 'system',
      modifiedBy: 'system',
    });

    const messages = await this.chatRepo.findByUserId(userId);

    return { userMessage, assistantMessage, messages };
  }
}

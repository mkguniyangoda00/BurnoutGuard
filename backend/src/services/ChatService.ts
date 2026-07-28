import { ChatRepository } from '../repositories/ChatRepository';
import { PredictionRepository } from '../repositories/PredictionRepository';
import { RecommendationRepository } from '../repositories/RecommendationRepository';
import { ResourceRepository } from '../repositories/ResourceRepository';
import { ChatMessage } from '../models/ChatMessage';
import { ShapExplanation } from '../models/ShapExplanation';

interface ConversationContext {
  prediction: { riskLevel: string; riskScore: number } | null;
  topShapRows: ShapExplanation[];
  activeRecommendations: { title: string; category: string }[];
}

export class ChatService {
  constructor(
    private chatRepo: ChatRepository,
    private predictionRepo: PredictionRepository,
    private recommendationRepo: RecommendationRepository,
    private resourceRepo: ResourceRepository
  ) {}

  private async buildContext(userId: string): Promise<ConversationContext> {
    const prediction = await this.predictionRepo.findLatestByUser(userId);
    const topShapRows = prediction?.shapExplanations
      ? [...prediction.shapExplanations].sort((a, b) => a.importanceRank - b.importanceRank).slice(0, 3)
      : [];

    const activeRecs = await this.recommendationRepo.findActiveByUser(userId);
    const activeRecommendations = activeRecs.map((r: any) => ({ title: r.title, category: r.category }));

    return {
      prediction: prediction ? { riskLevel: prediction.riskLevel, riskScore: prediction.riskScore } : null,
      topShapRows,
      activeRecommendations,
    };
  }

  private formatTopFactors(shapRows: ShapExplanation[]) {
    if (shapRows.length === 0) {
      return 'I do not have enough prediction detail yet to personalize this response.';
    }
    const factors = shapRows.map((row) => row.featureName.replace(/([A-Z])/g, ' $1').toLowerCase());
    return `Your current prediction is most influenced by ${factors.join(', ')}.`;
  }

  /**
   * Intent patterns are checked in order — more specific intents are
   * listed first so they take priority over broad fallback categories
   * (e.g. "sleep" should match before the generic "risk" pattern if both
   * could technically apply).
   */
  private readonly intentHandlers: {
    pattern: RegExp;
    handle: (ctx: ConversationContext) => Promise<string> | string;
  }[] = [
    {
      pattern: /(hello|hi there|hey|good morning|good afternoon|good evening)/,
      handle: (ctx) =>
        ctx.prediction
          ? `Hello. Your latest burnout risk is ${ctx.prediction.riskLevel} at ${(ctx.prediction.riskScore * 100).toFixed(0)}%. ${this.formatTopFactors(ctx.topShapRows)} Ask me about your recommendations, sleep, workload, or the wellness resources if you'd like more detail.`
          : 'Hello. Complete a check-in first and I can personalize your burnout guidance with your latest prediction.',
    },
    {
      pattern: /(what.?if|what if|simulate|simulation|counterfactual)/,
      handle: () =>
        'Use the What-If Simulator (under My Risk or the Dashboard) to adjust sleep, work hours, meetings, and other factors and see how your predicted burnout risk would change. It uses the same model that generated your current prediction.',
    },
    {
      pattern: /(journal|reflect|reflection|write about my day)/,
      handle: () =>
        'The Journal page lets you privately write about your day — stress triggers, work challenges, positive events, and coping strategies. It is not analyzed for your risk score directly, but keeping a regular journal can help you notice patterns over time.',
    },
    {
      pattern: /(wellness|resource|article|breathing|meditation|counsel|counseling|therapist|help me find)/,
      handle: async () => {
        const resources = await this.resourceRepo.findAllActive();
        if (!resources.length) {
          return 'The Wellness Resource Center has articles, sleep hygiene guides, breathing exercises, and counseling links — check the "Wellness Resources" page in the navigation menu.';
        }
        const sample = resources.slice(0, 3).map((r: any) => r.title).join('; ');
        return `The Wellness Resource Center has guides on sleep hygiene, exercise, breathing techniques, and confidential counseling contacts. A few examples: ${sample}. You can find the full list under "Wellness Resources" in the navigation menu.`;
      },
    },
    {
      pattern: /(recommend|advice|suggest|help me|action plan|what should i do)/,
      handle: (ctx) => {
        if (ctx.activeRecommendations.length > 0) {
          const list = ctx.activeRecommendations.slice(0, 3).map((r) => r.title).join('; ');
          return `You currently have ${ctx.activeRecommendations.length} active recommendation(s): ${list}. Check the Recommendations page for full details and to mark them complete.`;
        }
        return ctx.prediction
          ? `Based on your current data, I would focus on the top drivers behind your ${ctx.prediction.riskLevel.toLowerCase()} risk. ${this.formatTopFactors(ctx.topShapRows)} Check the Recommendations page for a full personalized action plan.`
          : 'I can generate more specific recommendations after you submit a check-in and a prediction is available.';
      },
    },
    {
      pattern: /(meeting|meetings|context switch|sprint pressure|on.?call|urgent task|bug.?fixing|deadline)/,
      handle: (ctx) =>
        ctx.prediction
          ? `Work-pattern factors like meeting load, sprint pressure, and context switching can meaningfully affect burnout risk. ${this.formatTopFactors(ctx.topShapRows)} If these feel unmanageable, the "request manager support" and "reduce meeting overload" recommendations are designed for exactly this.`
          : 'Meeting overload, sprint pressure, and frequent context switching are known burnout risk factors. Submit a check-in with your Work Patterns section filled in and I can tell you how these are affecting your specific risk.',
    },
    {
      pattern: /(risk|score|prediction|burnout)/,
      handle: (ctx) =>
        ctx.prediction
          ? `Your latest burnout risk is ${ctx.prediction.riskLevel} with a score of ${(ctx.prediction.riskScore * 100).toFixed(0)}%. ${this.formatTopFactors(ctx.topShapRows)}`
          : 'No prediction is available yet. Submit a check-in to generate your first risk score.',
    },
    {
      pattern: /(sleep|rest|tired|insomnia)/,
      handle: (ctx) =>
        ctx.prediction
          ? `Sleep is one of the biggest factors in most burnout profiles, including yours. ${this.formatTopFactors(ctx.topShapRows)} A consistent bedtime and reducing screen time 45 minutes before sleep are two of the highest-impact changes you can make.`
          : 'Sleep quality matters a lot for burnout risk. Once you have a prediction, I can tailor advice to your data.',
    },
    {
      pattern: /(stress|overwhelm|pressure|anxious|anxiety)/,
      handle: () =>
        'When stress or anxiety is high, short breathing exercises (try the 4-7-8 technique in Wellness Resources) and reducing workload where possible both help. If this feeling persists, the Counseling section has confidential support contacts.',
    },
    {
      pattern: /(exercise|walk|physical activity|workout)/,
      handle: () =>
        'Even short activity, like a 20-minute walk during lunch, measurably reduces stress hormones. Check the Exercise section of Wellness Resources for no-equipment routines designed for people who sit most of the day.',
    },
    {
      pattern: /(what is burnout|define burnout|burnout mean)/,
      handle: () =>
        'Burnout is a state of physical and emotional exhaustion caused by prolonged, unmanaged workplace stress. It typically has three dimensions: exhaustion, cynicism or mental distance from your work, and reduced sense of professional effectiveness.',
    },
    {
      pattern: /(thank|thanks|appreciate)/,
      handle: () => "You're welcome. I'm here anytime you want to check your risk, recommendations, or find a wellness resource.",
    },
    {
      pattern: /(bye|goodbye|see you)/,
      handle: () => 'Take care of yourself. Come back anytime you want to check in on your wellbeing.',
    },
    {
      pattern: /(help|what can you do|commands)/,
      handle: () =>
        'I can help with: your current burnout risk, your active recommendations, sleep and stress guidance, meeting/workload patterns, the wellness resource center, the what-if simulator, and journaling. Just ask naturally, e.g. "why is my risk high?" or "what should I do about my workload?"',
    },
  ];

  private async buildReply(content: string, ctx: ConversationContext): Promise<string> {
    const normalized = content.toLowerCase();

    for (const { pattern, handle } of this.intentHandlers) {
      if (pattern.test(normalized)) {
        return handle(ctx);
      }
    }

    // Fallback — no intent matched
    return ctx.prediction
      ? `I can help with burnout risk, recommendations, sleep, stress, workload patterns, journaling, or wellness resources. Your current risk is ${ctx.prediction.riskLevel}. Ask me something more specific and I'll do my best — or try "help" to see what I can do.`
      : 'I can help with burnout risk, recommendations, sleep, stress, and wellness resources. Submit a check-in first so I can personalize my guidance. Try "help" to see everything I can do.';
  }

  async getHistory(userId: string): Promise<ChatMessage[]> {
    return this.chatRepo.findByUserId(userId);
  }

  async sendMessage(userId: string, content: string): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage; messages: ChatMessage[] }> {
    const context = await this.buildContext(userId);

    const userMessage = await this.chatRepo.create({
      userId,
      role: 'user',
      content,
      relatedPredictionId: null,
      createdBy: userId,
      modifiedBy: userId,
    });

    const replyContent = await this.buildReply(content, context);

    const assistantMessage = await this.chatRepo.create({
      userId,
      role: 'assistant',
      content: replyContent,
      relatedPredictionId: null,
      createdBy: 'system',
      modifiedBy: 'system',
    });

    const messages = await this.chatRepo.findByUserId(userId);

    return { userMessage, assistantMessage, messages };
  }
}
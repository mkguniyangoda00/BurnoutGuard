import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/ChatService';

export class ChatController {
  constructor(private chatService: ChatService) {}

  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const messages = await this.chatService.getHistory(req.user!.userId);
      res.status(200).json({ messages });
    } catch (err) {
      next(err);
    }
  };

  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { message } = req.body as { message?: string };

      if (!message || !message.trim()) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const result = await this.chatService.sendMessage(req.user!.userId, message.trim());
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}

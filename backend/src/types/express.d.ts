// Global Express type augmentation for req.user
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: string; email?: string; };
    }
  }
}

export {};

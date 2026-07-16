import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Env } from './config/env';

// Routes
import AuthRoutes from './routes/AuthRoutes';
import CheckInRoutes from './routes/checkinRoutes';
import PredictionRoutes from './routes/predictionRoutes';
import RecommendationRoutes from './routes/RecommendationRoutes';
import ReportRoutes from './routes/ReportRoutes';
import AlertRoutes from './routes/AlertRoutes';
import AnalyticsRoutes from './routes/AnalyticsRoutes';
import AdminRoutes from './routes/AdminRoutes';

// Jobs & Services
import { startWeeklyReportJob } from './jobs/WeeklyReportJob';
import { ReportService } from './services/ReportService';
import { ReportRepository } from './repositories/ReportRepository';
import { CheckInRepository } from './repositories/CheckInRepository';

const app = express();

// ── Middlewares ───────────────────────────────────────────────────────────────
app.use(helmet());
// restricted CORS using your env variable
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',  // fallback if 5173 is taken
    Env.FRONTEND_URL,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));
app.use(express.json());

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    project: 'BurnoutGuard',
    timestamp: new Date(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', AuthRoutes);
app.use('/api/checkins', CheckInRoutes);
app.use('/api/predictions', PredictionRoutes);
app.use('/api/recommendations', RecommendationRoutes);
app.use('/api/reports', ReportRoutes);
app.use('/api/alerts', AlertRoutes);
app.use('/api/analytics', AnalyticsRoutes);
app.use('/api/admin', AdminRoutes);

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;

  if (err.name === 'ZodError') {
    res.status(400).json({ error: 'Validation error', details: err.errors });
    return;
  }

  res.status(statusCode).json({ error: err.message || 'Internal Server Error' });
});

// ── Scheduled Jobs ────────────────────────────────────────────────────────────
const reportService = new ReportService(
  new ReportRepository(),
  new CheckInRepository()
);
startWeeklyReportJob(reportService);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = Env.PORT;
app.listen(PORT, () => {
  console.log(`[BurnoutGuard] Server running on http://localhost:${PORT}`);
  console.log(`[BurnoutGuard] Health: http://localhost:${PORT}/api/health`);
});

export default app;

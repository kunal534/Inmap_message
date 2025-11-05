import 'express';
import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

import { ImapService } from './services/ImapService';
import { ElasticsearchService } from './services/ElasticsearchService';
import { AICategorizationService } from './services/AICategorizationService';
import { NotificationService } from './services/NotificationService';

import authRoutes from './routes/auth.routes';
import emailRoutes from './routes/email.routes';
import aiRoutes from './routes/ai.routes';

const app: Express = express();

const corsOptions = {
  origin: ['http://localhost:3001', 'http://localhost:3000', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};


app.use(cors(corsOptions));

// Security middleware
app.use(helmet());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});
app.use('/api/', limiter);

// Health check (no auth needed)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

let imapService: ImapService;
let esService: ElasticsearchService;
let aiService: AICategorizationService;
let notificationService: NotificationService;

// Initialize services on first request
app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (!imapService) {
    try {
      console.log('🚀 Initializing services...');

      esService = new ElasticsearchService();
      console.log('✅ Elasticsearch service initialized');

      aiService = new AICategorizationService();
      console.log('✅ AI service initialized');

      notificationService = new NotificationService(
        process.env.SLACK_WEBHOOK_URL || '',
        process.env.EXTERNAL_WEBHOOK_URL || ''
      );
      console.log('✅ Notification service initialized');

      imapService = new ImapService(esService, aiService, notificationService);
      console.log('✅ IMAP service initialized');

      const tenantId = process.env.TENANT_ID || 'default-tenant';
      await imapService.initialize(tenantId);
      console.log(`✅ All services ready for tenant: ${tenantId}`);
    } catch (error) {
      console.error('❌ Error initializing services:', error);
    }
  }
  next();
});

// Attach services to request object
app.use((req: Request, res: Response, next: NextFunction) => {
  (req as any).imapService = imapService;
  (req as any).esService = esService;
  (req as any).aiService = aiService;
  (req as any).notificationService = notificationService;
  next();
});

// Routes
app.use('/api/auth', authRoutes);           // Auth routes (no protection)
app.use('/api/emails', emailRoutes);        // Email routes
app.use('/api/ai', aiRoutes);               // AI routes

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('🔴 Uncaught error:', err);

  res.status(err.statusCode || 500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export { app, imapService, esService, aiService, notificationService };

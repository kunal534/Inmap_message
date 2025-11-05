"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.aiService = exports.esService = exports.imapService = exports.app = void 0;
require("express");
require("./types/express");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ImapService_1 = require("./services/ImapService");
const ElasticsearchService_1 = require("./services/ElasticsearchService");
const AICategorizationService_1 = require("./services/AICategorizationService");
const NotificationService_1 = require("./services/NotificationService");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const email_routes_1 = __importDefault(require("./routes/email.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const app = (0, express_1.default)();
exports.app = app;
// CORS Configuration - MUST BE FIRST
const corsOptions = {
    origin: ['http://localhost:3001', 'http://localhost:3000', 'http://127.0.0.1:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
};
app.use((0, cors_1.default)(corsOptions));
// Security middleware
app.use((0, helmet_1.default)());
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later'
});
app.use('/api/', limiter);
// Health check (no auth needed)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});
let imapService;
let esService;
let aiService;
let notificationService;
// Initialize services on first request
app.use(async (req, res, next) => {
    if (!imapService) {
        try {
            console.log('🚀 Initializing services...');
            exports.esService = esService = new ElasticsearchService_1.ElasticsearchService();
            console.log('✅ Elasticsearch service initialized');
            exports.aiService = aiService = new AICategorizationService_1.AICategorizationService();
            console.log('✅ AI service initialized');
            exports.notificationService = notificationService = new NotificationService_1.NotificationService(process.env.SLACK_WEBHOOK_URL || '', process.env.EXTERNAL_WEBHOOK_URL || '');
            console.log('✅ Notification service initialized');
            exports.imapService = imapService = new ImapService_1.ImapService(esService, aiService, notificationService);
            console.log('✅ IMAP service initialized');
            const tenantId = process.env.TENANT_ID || 'default-tenant';
            await imapService.initialize(tenantId);
            console.log(`✅ All services ready for tenant: ${tenantId}`);
        }
        catch (error) {
            console.error('❌ Error initializing services:', error);
        }
    }
    next();
});
// Attach services to request object
app.use((req, res, next) => {
    req.imapService = imapService;
    req.esService = esService;
    req.aiService = aiService;
    req.notificationService = notificationService;
    next();
});
// Routes
app.use('/api/auth', auth_routes_1.default); // Auth routes (no protection)
app.use('/api/emails', email_routes_1.default); // Email routes
app.use('/api/ai', ai_routes_1.default); // AI routes
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error('🔴 Uncaught error:', err);
    res.status(err.statusCode || 500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
//# sourceMappingURL=app.js.map
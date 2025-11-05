import dotenv from 'dotenv';
import { app } from './app';
import { DatabaseConfig } from './config/database.config';
import authRoutes from './routes/auth.routes';
dotenv.config();
app.use('/api/auth', authRoutes);
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  🚀 Starting ReachInbox Server...       ║');
    console.log('╚════════════════════════════════════════╝\n');

    console.log('📡 Testing Elasticsearch connection...');
    const esConnected = await DatabaseConfig.testConnection();
    
    if (!esConnected) {
      console.error('❌ Failed to connect to Elasticsearch');
      console.error('⚠️  Make sure Elasticsearch is running:');
      console.error('   docker-compose up -d');
      throw new Error('Elasticsearch connection failed');
    }

    console.log('✅ Elasticsearch connected\n');

    const server = app.listen(PORT, () => {
      console.log('╔════════════════════════════════════════╗');
      console.log('║   ✅ Server Running Successfully        ║');
      console.log('╠════════════════════════════════════════╣');
      console.log(`║ 📍 URL: http://localhost:${PORT}${' '.repeat(24 - PORT.toString().length)}║`);
      console.log(`║ 🌍 Environment: ${process.env.NODE_ENV || 'development'}${' '.repeat(20 - (process.env.NODE_ENV || 'development').length)}║`);
      console.log('╠════════════════════════════════════════╣');
      console.log('║ 📚 API Endpoints:                       ║');
      console.log(`║  • Health: http://localhost:${PORT}/health${' '.repeat(14 - PORT.toString().length)}║`);
      console.log(`║  • Auth: http://localhost:${PORT}/api/auth${' '.repeat(16 - PORT.toString().length)}║`);
      console.log(`║  • Emails: http://localhost:${PORT}/api/emails${' '.repeat(14 - PORT.toString().length)}║`);
      console.log(`║  • AI: http://localhost:${PORT}/api/ai${' '.repeat(22 - PORT.toString().length)}║`);
      console.log('╠════════════════════════════════════════╣');
      console.log('║ 🚀 First Steps:                         ║');
      console.log('║  1. Register: POST /api/auth/register   ║');
      console.log('║  2. Login: POST /api/auth/login         ║');
      console.log('║  3. Get Emails: GET /api/emails         ║');
      console.log('║  4. Get Stats: GET /api/emails/...      ║');
      console.log('║     categories/stats                    ║');
      console.log('╚════════════════════════════════════════╝\n');
    });

    // Graceful shutdown on SIGTERM
    process.on('SIGTERM', () => {
      console.log('\n📴 SIGTERM received - shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    // Graceful shutdown on SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      console.log('\n📴 SIGINT received - shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('💥 Uncaught Exception:', err);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    console.error('\n❌ Failed to start server:', error);
    console.error('\n📋 Troubleshooting:');
    console.error('  • Check Elasticsearch is running: docker-compose up -d');
    console.error('  • Verify .env file exists with all required variables');
    console.error('  • Check PORT is not already in use');
    process.exit(1);
  }
}

startServer();

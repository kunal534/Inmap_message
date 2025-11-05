import { ImapService } from '../services/ImapService';
import { ElasticsearchService } from '../services/ElasticsearchService';
import { AICategorizationService } from '../services/AICategorizationService';
import { NotificationService } from '../services/NotificationService';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      tenantId?: string;
      imapService?: ImapService;
      esService?: ElasticsearchService;
      aiService?: AICategorizationService;
      notificationService?: NotificationService;
    }
  }
}

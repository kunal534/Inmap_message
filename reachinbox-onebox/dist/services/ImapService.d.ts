import { ElasticsearchService } from './ElasticsearchService';
import { AICategorizationService } from './AICategorizationService';
import { NotificationService } from './NotificationService';
export interface ParsedEmail {
    messageId: string;
    accountId: string;
    tenantId: string;
    from?: string;
    to?: string;
    subject?: string;
    text?: string;
    html?: string;
    date?: Date;
    folder: string;
    uid: number;
}
export declare class ImapService {
    private connections;
    private esService;
    private aiService;
    private notificationService;
    private isInitialized;
    private tenantId;
    constructor(elasticsearchService: ElasticsearchService, aiCategorizationService: AICategorizationService, notificationService: NotificationService, tenantId?: string);
    initialize(tenantId?: string): Promise<void>;
    private connectAccount;
    private openInboxAndListen;
    private fetchRecentEmails;
    private fetchAndProcessEmails;
    private processMessage;
    private indexEmailToElasticsearch;
    private updateEmailCategory;
    private setupIdleMode;
    private fetchAndProcessNewEmails;
    private reconnect;
    getConnectionStatus(): Record<string, boolean>;
    getTenantId(): string;
    shutdown(): Promise<void>;
}

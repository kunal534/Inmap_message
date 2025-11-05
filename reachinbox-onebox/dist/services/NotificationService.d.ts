import { EmailCategory } from './AICategorizationService';
export interface EmailNotification {
    messageId: string;
    from: string;
    subject: string;
    category: EmailCategory;
    date: Date;
    preview: string;
}
export declare class NotificationService {
    private slackWebhook;
    private externalWebhookUrl;
    constructor(slackWebhookUrl?: string, externalWebhookUrl?: string);
    sendSlackNotification(email: EmailNotification): Promise<void>;
    triggerExternalWebhook(email: EmailNotification): Promise<void>;
    notifyInterestedEmail(email: EmailNotification): Promise<void>;
    sendTestNotification(): Promise<void>;
}

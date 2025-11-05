"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const webhook_1 = require("@slack/webhook");
const axios_1 = __importDefault(require("axios"));
class NotificationService {
    constructor(slackWebhookUrl, externalWebhookUrl) {
        this.slackWebhook = slackWebhookUrl
            ? new webhook_1.IncomingWebhook(slackWebhookUrl)
            : null;
        this.externalWebhookUrl = externalWebhookUrl || '';
    }
    async sendSlackNotification(email) {
        if (!this.slackWebhook) {
            console.warn('⚠️  Slack webhook not configured');
            return;
        }
        try {
            const message = {
                text: '🎯 New Interested Email!',
                blocks: [
                    {
                        type: 'header',
                        text: {
                            type: 'plain_text',
                            text: '📧 New Lead - Interested'
                        }
                    },
                    {
                        type: 'section',
                        fields: [
                            {
                                type: 'mrkdwn',
                                text: `*From:*\n${email.from}`
                            },
                            {
                                type: 'mrkdwn',
                                text: `*Category:*\n${email.category}`
                            },
                            {
                                type: 'mrkdwn',
                                text: `*Date:*\n${new Date(email.date).toLocaleString()}`
                            },
                            {
                                type: 'mrkdwn',
                                text: `*Subject:*\n${email.subject}`
                            }
                        ]
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Preview:*\n${email.preview.substring(0, 300)}...`
                        }
                    },
                    {
                        type: 'divider'
                    },
                    {
                        type: 'context',
                        elements: [
                            {
                                type: 'mrkdwn',
                                text: `Message ID: \`${email.messageId}\``
                            }
                        ]
                    }
                ]
            };
            await this.slackWebhook.send(message);
            console.log('✅ Slack notification sent successfully');
        }
        catch (error) {
            console.error('❌ Error sending Slack notification:', error);
        }
    }
    async triggerExternalWebhook(email) {
        if (!this.externalWebhookUrl) {
            console.warn('⚠️  External webhook URL not configured');
            return;
        }
        try {
            const payload = {
                event: 'email.interested',
                timestamp: new Date().toISOString(),
                data: {
                    emailId: email.messageId,
                    from: email.from,
                    subject: email.subject,
                    category: email.category,
                    receivedAt: email.date,
                    preview: email.preview
                }
            };
            await axios_1.default.post(this.externalWebhookUrl, payload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            console.log('✅ External webhook triggered successfully');
        }
        catch (error) {
            console.error('❌ Error triggering external webhook:', error);
        }
    }
    async notifyInterestedEmail(email) {
        console.log(`📢 Sending notifications for: ${email.subject}`);
        try {
            await Promise.all([
                this.sendSlackNotification(email),
                this.triggerExternalWebhook(email)
            ]);
            console.log('✅ All notifications sent');
        }
        catch (error) {
            console.error('❌ Error in notification process:', error);
        }
    }
    async sendTestNotification() {
        const testEmail = {
            messageId: 'test-' + Date.now(),
            from: 'test@example.com',
            subject: 'Test Email from ReachInbox',
            category: 'Interested',
            date: new Date(),
            preview: 'This is a test email to verify webhook setup'
        };
        console.log('🧪 Sending test notification...');
        await this.notifyInterestedEmail(testEmail);
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=NotificationService.js.map
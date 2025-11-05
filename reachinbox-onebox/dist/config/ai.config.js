"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIConfig = void 0;
class AIConfig {
    static getMistralApiKey() {
        const apiKey = process.env.MISTRAL_API_KEY;
        if (!apiKey) {
            throw new Error('MISTRAL_API_KEY is not set in environment variables');
        }
        return apiKey;
    }
    static getSlackWebhookUrl() {
        return process.env.SLACK_WEBHOOK_URL || '';
    }
    static getExternalWebhookUrl() {
        return process.env.EXTERNAL_WEBHOOK_URL || '';
    }
}
exports.AIConfig = AIConfig;
//# sourceMappingURL=ai.config.js.map
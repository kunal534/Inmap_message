export class AIConfig {
  static getMistralApiKey(): string {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY is not set in environment variables');
    }
    return apiKey;
  }

  static getSlackWebhookUrl(): string {
    return process.env.SLACK_WEBHOOK_URL || '';
  }

  static getExternalWebhookUrl(): string {
    return process.env.EXTERNAL_WEBHOOK_URL || '';
  }
}

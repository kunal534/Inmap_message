import Mistral from '@mistralai/mistralai';
import { AIConfig } from '../config/ai.config';

export type EmailCategory = 
  | 'Interested' 
  | 'Meeting Booked' 
  | 'Not Interested' 
  | 'Spam' 
  | 'Out of Office';

export class AICategorizationService {
   private client: Mistral;
  private cache: Map<string, { category: EmailCategory; timestamp: number }>;
  private CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    // Mistral client initialization - pass API key directly
    this.client = new Mistral(AIConfig.getMistralApiKey());
    this.cache = new Map();
  }

  async categorizeEmail(email: any): Promise<EmailCategory> {
    // Check cache first
    const cacheKey = email.messageId;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('✅ Using cached categorization for:', email.messageId);
      return cached.category;
    }

    try {
      const category = await this.callMistralAPI(email);
      
      // Cache the result
      this.cache.set(cacheKey, { 
        category, 
        timestamp: Date.now() 
      });
      
      return category;
    } catch (error) {
      console.error('Error categorizing email:', error);
      return 'Not Interested'; // Default fallback
    }
  }

  private async callMistralAPI(email: any): Promise<EmailCategory> {
    const prompt = this.buildCategorizationPrompt(email);

    const chatResponse = await this.client.chat({
      model: 'mistral-small-latest',
      messages: [
        {
          role: 'system',
          content: 'You are an expert email classifier. Respond with ONLY one of these exact categories: Interested, Meeting Booked, Not Interested, Spam, Out of Office'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      maxTokens: 20
    });

    const response = chatResponse.choices?.[0]?.message?.content?.trim() || 'Not Interested';
    
    return this.parseCategory(response);
  }

  private buildCategorizationPrompt(email: any): string {
    const emailText = email.text || email.html || '';
    const truncatedBody = emailText.substring(0, 1000);

    return `
Classify this email into ONE category:

Categories:
1. Interested - Shows interest in product/service, wants more info
2. Meeting Booked - Wants to schedule a meeting or has scheduled one
3. Not Interested - Explicitly declines or shows no interest
4. Spam - Promotional, irrelevant marketing, or spam
5. Out of Office - Automated out-of-office reply

Email Details:
From: ${email.from || 'Unknown'}
Subject: ${email.subject || 'No Subject'}
Body: ${truncatedBody}

Category:`;
  }

  private parseCategory(response: string): EmailCategory {
    const normalized = response.toLowerCase().trim();
    
    if (normalized.includes('interested') && !normalized.includes('not')) {
      return 'Interested';
    }
    if (normalized.includes('meeting') || normalized.includes('booked')) {
      return 'Meeting Booked';
    }
    if (normalized.includes('not interested')) {
      return 'Not Interested';
    }
    if (normalized.includes('spam')) {
      return 'Spam';
    }
    if (normalized.includes('out of office') || normalized.includes('ooo')) {
      return 'Out of Office';
    }
    
    return 'Not Interested';
  }

  async batchCategorize(emails: any[]): Promise<Map<string, EmailCategory>> {
    const categorizations = new Map<string, EmailCategory>();
    
    const batchSize = 3;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const promises = batch.map(email => this.categorizeEmail(email));
      const results = await Promise.all(promises);
      
      batch.forEach((email, idx) => {
        categorizations.set(email.messageId, results[idx]);
      });
      
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return categorizations;
  }
}

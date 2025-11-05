export type EmailCategory = 'Interested' | 'Meeting Booked' | 'Not Interested' | 'Spam' | 'Out of Office';
export declare class AICategorizationService {
    private client;
    private cache;
    private CACHE_TTL;
    constructor();
    categorizeEmail(email: any): Promise<EmailCategory>;
    private callMistralAPI;
    private buildCategorizationPrompt;
    private parseCategory;
    batchCategorize(emails: any[]): Promise<Map<string, EmailCategory>>;
}

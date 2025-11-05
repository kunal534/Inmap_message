export declare class ElasticsearchService {
    private client;
    private indexName;
    constructor();
    private initializeIndex;
    indexEmail(email: any): Promise<void>;
    bulkIndexEmails(emails: any[]): Promise<void>;
    searchEmails(query?: string, filters?: any): Promise<any[]>;
    getEmailsByCategory(category: string): Promise<any[]>;
    getCategoryStats(): Promise<any[]>;
}

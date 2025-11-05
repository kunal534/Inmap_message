import { Client } from '@elastic/elasticsearch';
export declare class DatabaseConfig {
    private static client;
    static getElasticsearchClient(): Client;
    static testConnection(): Promise<boolean>;
}

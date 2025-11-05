import { Client } from '@elastic/elasticsearch';

export class DatabaseConfig {
  private static client: Client;

  static getElasticsearchClient(): Client {
    if (!this.client) {
      this.client = new Client({
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
      });
    }
    return this.client;
  }

  static async testConnection(): Promise<boolean> {
    try {
      const client = this.getElasticsearchClient();
      const health = await client.cluster.health();
      console.log(' Elasticsearch connected:', health.status);
      return true;
    } catch (error) {
      console.error(' Elasticsearch connection failed:', error);
      return false;
    }
  }
}

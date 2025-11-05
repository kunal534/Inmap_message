"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConfig = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
class DatabaseConfig {
    static getElasticsearchClient() {
        if (!this.client) {
            this.client = new elasticsearch_1.Client({
                node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
            });
        }
        return this.client;
    }
    static async testConnection() {
        try {
            const client = this.getElasticsearchClient();
            const health = await client.cluster.health();
            console.log(' Elasticsearch connected:', health.status);
            return true;
        }
        catch (error) {
            console.error(' Elasticsearch connection failed:', error);
            return false;
        }
    }
}
exports.DatabaseConfig = DatabaseConfig;
//# sourceMappingURL=database.config.js.map
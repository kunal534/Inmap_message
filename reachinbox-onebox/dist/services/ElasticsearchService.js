"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticsearchService = void 0;
const database_config_1 = require("../config/database.config");
class ElasticsearchService {
    constructor() {
        this.indexName = 'emails';
        this.client = database_config_1.DatabaseConfig.getElasticsearchClient();
        this.initializeIndex();
    }
    async initializeIndex() {
        try {
            const indexExists = await this.client.indices.exists({
                index: this.indexName
            });
            if (!indexExists) {
                await this.client.indices.create({
                    index: this.indexName,
                    body: {
                        mappings: {
                            properties: {
                                accountId: { type: 'keyword' },
                                messageId: { type: 'keyword' },
                                from: { type: 'text' },
                                to: { type: 'text' },
                                subject: { type: 'text' },
                                text: { type: 'text' },
                                html: { type: 'text' },
                                date: { type: 'date' },
                                folder: { type: 'keyword' },
                                category: { type: 'keyword' },
                                isRead: { type: 'boolean' },
                                hasAttachments: { type: 'boolean' },
                                createdAt: { type: 'date' }
                            }
                        }
                    }
                });
                console.log('✅ Elasticsearch index created:', this.indexName);
            }
        }
        catch (error) {
            console.error('Error initializing Elasticsearch index:', error);
        }
    }
    async indexEmail(email) {
        try {
            await this.client.index({
                index: this.indexName,
                id: email.messageId,
                document: {
                    ...email,
                    createdAt: new Date()
                }
            });
            console.log('✅ Email indexed:', email.messageId);
        }
        catch (error) {
            console.error('Error indexing email:', error);
        }
    }
    async bulkIndexEmails(emails) {
        if (emails.length === 0)
            return;
        try {
            const body = emails.flatMap(email => [
                { index: { _index: this.indexName, _id: email.messageId } },
                { ...email, createdAt: new Date() }
            ]);
            const result = await this.client.bulk({ body, refresh: true });
            console.log(`✅ Bulk indexed ${emails.length} emails`);
            if (result.errors) {
                console.error('Some emails failed to index');
            }
        }
        catch (error) {
            console.error('Error bulk indexing emails:', error);
        }
    }
    async searchEmails(query = '', filters = {}) {
        try {
            const must = [];
            if (query) {
                must.push({
                    multi_match: {
                        query,
                        fields: ['subject^2', 'text', 'from', 'to']
                    }
                });
            }
            if (filters.tenantId) {
                must.push({ term: { tenantId: filters.tenantId } });
            }
            if (filters.accountId) {
                must.push({ term: { accountId: filters.accountId } });
            }
            if (filters.folder) {
                must.push({ term: { folder: filters.folder } });
            }
            if (filters.category) {
                must.push({ term: { category: filters.category } });
            }
            const result = await this.client.search({
                index: this.indexName,
                body: {
                    query: must.length > 0 ? { bool: { must } } : { match_all: {} },
                    sort: [{ date: 'desc' }],
                    size: filters.size || 20,
                    from: filters.from || 0
                }
            });
            return result.hits.hits.map(hit => hit._source);
        }
        catch (error) {
            console.error('Error searching emails:', error);
            return [];
        }
    }
    async getEmailsByCategory(category) {
        try {
            const result = await this.client.search({
                index: this.indexName,
                body: {
                    query: {
                        term: { category }
                    },
                    sort: [{ date: 'desc' }]
                }
            });
            return result.hits.hits.map(hit => hit._source);
        }
        catch (error) {
            console.error('Error fetching emails by category:', error);
            return [];
        }
    }
    async getCategoryStats() {
        try {
            const result = await this.client.search({
                index: this.indexName,
                body: {
                    size: 0,
                    aggs: {
                        categories: {
                            terms: { field: 'category', size: 100 }
                        }
                    }
                }
            });
            const aggs = result.aggregations;
            const categoryAggs = aggs?.categories;
            const buckets = categoryAggs?.buckets;
            return buckets || [];
        }
        catch (error) {
            console.error('Error fetching category stats:', error);
            return [];
        }
    }
}
exports.ElasticsearchService = ElasticsearchService;
//# sourceMappingURL=ElasticsearchService.js.map
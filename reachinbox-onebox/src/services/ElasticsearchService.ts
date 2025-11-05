import { Client } from '@elastic/elasticsearch';
import { DatabaseConfig } from '../config/database.config';

export class ElasticsearchService {
  private client: Client;
  private indexName = 'emails';

  constructor() {
    this.client = DatabaseConfig.getElasticsearchClient();
    this.initializeIndex();
  }

  private async initializeIndex(): Promise<void> {
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
    } catch (error) {
      console.error('Error initializing Elasticsearch index:', error);
    }
  }

async indexEmail(email: any) {
  try {
    console.log('📌 Indexing email:', email.messageId, email.subject);
    
    const doc = {
      messageId: email.messageId,
      from: email.from,
      to: email.to,
      subject: email.subject,
      text: email.text,
      category: email.category || 'Uncategorized',
      date: email.date || new Date(),
      timestamp: new Date()
    };

    console.log('📝 Doc to index:', JSON.stringify(doc).substring(0, 100));

    const result = await this.client.index({
      index: 'emails',
      id: email.messageId,
      body: doc
    });

    console.log('✅ Email indexed successfully, ES ID:', result._id);
    return result;
  } catch (error: any) {
    console.error('❌ Error indexing email:', {
      messageId: email.messageId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}



async getStats() {
  try {
    console.log('📊 Getting email stats from ES');
    
    const result = await this.client.search({
      index: 'emails',
      body: {
        size: 0,
        aggs: {
          categories: {
            terms: {
              field: 'category.keyword',
              size: 100
            }
          }
        }
      }
    });

    const buckets = (result as any).aggregations?.categories?.buckets || [];
    const stats = buckets.map((b: any) => ({
      key: b.key,
      doc_count: b.doc_count
    }));

    console.log('✅ Stats:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    return [];
  }
}

async updateEmail(messageId: string, updates: any) {
  try {
    console.log(`📝 Updating email in ES: ${messageId}`);
    
    const result = await this.client.update({
      index: 'emails',
      id: messageId,
      body: {
        doc: {
          ...updates,
          updatedAt: new Date()
        }
      }
    });

    console.log(`✅ Email updated in ES`);
    return result;
  } catch (error) {
    console.error('❌ Error updating email:', error);
  }
}


  async bulkIndexEmails(emails: any[]): Promise<void> {
    if (emails.length === 0) return;

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
    } catch (error) {
      console.error('Error bulk indexing emails:', error);
    }
  }

  async searchEmails(query: string = '', filters: any = {}): Promise<any[]> {
    try {
      const must: any[] = [];

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
    } catch (error) {
      console.error('Error searching emails:', error);
      return [];
    }
  }

  async getEmailsByCategory(category: string): Promise<any[]> {
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
    } catch (error) {
      console.error('Error fetching emails by category:', error);
      return [];
    }
  }
  async getCategoryStats(): Promise<any[]>{
    try{
        const result = await this.client.search({
            index:this.indexName,
            body:{
                size:0,
                aggs:{
                        categories: {
                        terms: { field: 'category', size: 100 }
                    }
                }
            }
        });
       const aggs = result.aggregations as Record<string, any>;
    const categoryAggs = aggs?.categories as Record<string, any>;
    const buckets = categoryAggs?.buckets as any[] | undefined;

    return buckets || [];
  } catch (error) {
    console.error('Error fetching category stats:', error);
    return []; 
    }
  }
}



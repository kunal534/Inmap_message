import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { ImapConfig, ImapAccount } from '../config/imap.config';
import { ElasticsearchService } from './ElasticsearchService';
import { AICategorizationService, EmailCategory } from './AICategorizationService';
import { NotificationService } from './NotificationService';

export interface ParsedEmail {
  messageId: string;
  accountId: string;
  tenantId: string;
  from?: string;
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
  date?: Date;
  folder: string;
  uid: number;
}

export class ImapService {
  private connections: Map<string, Imap> = new Map();
  private esService: ElasticsearchService;
  private aiService: AICategorizationService;
  private notificationService: NotificationService;
  private isInitialized = false;
  private tenantId: string = '';

  constructor(
    elasticsearchService: ElasticsearchService,
    aiCategorizationService: AICategorizationService,
    notificationService: NotificationService,
    tenantId: string = ''
  ) {
    this.esService = elasticsearchService;
    this.aiService = aiCategorizationService;
    this.notificationService = notificationService;
    this.tenantId = tenantId;
  }

  async initialize(tenantId?: string): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️  IMAP Service already initialized');
      return;
    }

    if (tenantId) {
      this.tenantId = tenantId;
    }

    const accounts = ImapConfig.getAccounts();
    console.log(`📧 Initializing ${accounts.length} IMAP accounts for tenant: ${this.tenantId}...`);

    for (const account of accounts) {
      try {
        await this.connectAccount(account);
        console.log(`✅ Connected to account: ${account.id}`);
      } catch (error) {
        console.error(`❌ Failed to connect account ${account.id}:`, error);
      }
    }

    this.isInitialized = true;
    console.log('✅ IMAP Service initialized successfully');
  }

  private async connectAccount(config: ImapAccount): Promise<void> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port,
        tls: config.tls,
        tlsOptions: { rejectUnauthorized: false },
        keepalive: {
          interval: 10000,
          idleInterval: 300000,
          forceNoop: false
        },
        connTimeout: 30000,
        authTimeout: 10000
      });

      imap.once('ready', () => {
        console.log(`✅ IMAP ready for ${config.id}`);
        this.openInboxAndListen(imap, config.id);
        resolve();
      });

      imap.on('error', (err: Error) => {
        console.error(`❌ IMAP error for ${config.id}:`, err.message);
        this.reconnect(config);
      });

      imap.once('end', () => {
        console.log(`🔌 IMAP connection ended for ${config.id}`);
        this.reconnect(config);
      });

      imap.on('alert', (message: string) => {
        console.warn(`⚠️  IMAP Alert for ${config.id}:`, message);
      });

      this.connections.set(config.id, imap);
      imap.connect();
    });
  }

  private openInboxAndListen(imap: Imap, accountId: string): void {
  imap.openBox('INBOX', false, async (err, box) => {
    if (err) {
      console.error(`❌ Error opening INBOX for ${accountId}:`, err);
      return;
    }

    console.log(`📬 INBOX opened for ${accountId}. Total messages: ${box.messages.total}`);

    // ⭐ FETCH ONLY LAST 5 DAYS / 10 EMAILS
    await this.fetchRecentEmails(imap, accountId, 5);
    this.setupIdleMode(imap, accountId);
  });
}


  private async fetchRecentEmails(
  imap: Imap,
  accountId: string,
  days: number
): Promise<void> {
  return new Promise((resolve) => {
    const searchDate = new Date();
    searchDate.setDate(searchDate.getDate() - days);

    const searchCriteria = [['SINCE', searchDate]];

    imap.search(searchCriteria, (err, results) => {
      if (err) {
        console.error(`❌ Search error for ${accountId}:`, err);
        resolve();
        return;
      }

      if (!results || results.length === 0) {
        console.log(`📭 No emails found in last ${days} days for ${accountId}`);
        resolve();
        return;
      }

      // ⭐ LIMIT TO FIRST 10 EMAILS ONLY
      const limitedResults = results.slice(0, 10);
      console.log(`📥 Found ${results.length} emails, limiting to ${limitedResults.length} for ${accountId}`);
      
      this.fetchAndProcessEmails(imap, accountId, limitedResults, resolve);
    });
  });
}


  private fetchAndProcessEmails(
    imap: Imap,
    accountId: string,
    uids: number[],
    callback: () => void
  ): void {
    if (uids.length === 0) {
      callback();
      return;
    }

    const fetch = imap.fetch(uids, { bodies: '' });
    let processedCount = 0;

    fetch.on('message', (msg, seqno) => {
      this.processMessage(msg, seqno, accountId, 'INBOX');
      processedCount++;
    });

    fetch.once('error', (err) => {
      console.error(`❌ Fetch error for ${accountId}:`, err);
    });

    fetch.once('end', () => {
      console.log(`✅ Processed ${processedCount} emails for ${accountId}`);
      callback();
    });
  }

  private async processMessage(
    msg: any,
    seqno: number,
    accountId: string,
    folder: string
  ): Promise<void> {
    let buffer = '';

    msg.on('body', (stream: any) => {
      stream.on('data', (chunk: Buffer) => {
        buffer += chunk.toString('utf8');
      });

      stream.once('end', async () => {
        try {
          const parsed = await simpleParser(buffer);

          const email: ParsedEmail = {
            messageId: parsed.messageId || `${accountId}-${seqno}-${Date.now()}`,
            accountId,
            tenantId: this.tenantId,
            from: (parsed.from as any)?.text || (parsed.from as any)?.address || 'Unknown',
            to: (parsed.to as any)?.text || (parsed.to as any)?.address || '',
            subject: parsed.subject || '(No Subject)',
            text: parsed.text || '',
            html: parsed.html || '',
            date: parsed.date || new Date(),
            folder,
            uid: seqno
          };

          await this.indexEmailToElasticsearch(email);

          const category = await this.aiService.categorizeEmail(email);

          await this.updateEmailCategory(email, category);

          console.log(`✅ Processed email: ${(email.subject || '(No Subject)').substring(0, 50)}`);
        } catch (error) {
          console.error(`❌ Error processing message ${seqno}:`, error);
        }
      });
    });

    msg.on('attributes', (attrs: any) => {
      // Handle email attributes if needed
    });
  }

  private async indexEmailToElasticsearch(email: ParsedEmail): Promise<void> {
    await this.esService.indexEmail({
      ...email,
      category: 'Uncategorized',
      createdAt: new Date()
    });
  }

  private async updateEmailCategory(
  email: ParsedEmail,
  category: EmailCategory
): Promise<void> {
  console.log(`🏷️  Categorized as: ${category}`);

  // Update email in Elasticsearch with the category
  try {
    await this.esService.updateEmail(email.messageId, {
      category: category,
      categorizedAt: new Date()
    });
    console.log(`✅ Updated category in ES for: ${email.messageId}`);
  } catch (error) {
    console.error(`❌ Error updating email category:`, error);
  }

  if (category === 'Interested') {
    await this.notificationService.notifyInterestedEmail({
      messageId: email.messageId,
      from: email.from || 'Unknown',
      subject: email.subject || '(No Subject)',
      category,
      date: email.date || new Date(),
      preview: email.text?.substring(0, 200) || ''
    });
  }
}

  
 private setupIdleMode(imap: Imap, accountId: string): void {
  const imapConnection = imap as any;

  if (!imapConnection || typeof imapConnection.idle !== 'function') {
    console.log(`⚠️  IDLE not available for ${accountId} - polling instead`);
    // Don't retry, just fetch periodically instead
    setInterval(() => {
      imapConnection.search(['UNSEEN'], async (err: any, results: any) => {
        if (!err && results && results.length > 0) {
          console.log(`📨 ${results.length} new message(s) for ${accountId}`);
          await this.fetchAndProcessNewEmails(imap, accountId, results);
        }
      });
    }, 60000); // Check every 60 seconds instead
    return;
  }

  imapConnection.idle((err: any) => {
    if (err) {
      console.error(`❌ IDLE error for ${accountId}:`, err.message);
      // Don't retry infinitely
      return;
    }

    console.log(`⏱️  IDLE mode active for ${accountId}`);

    imapConnection.on('mail', (numNewMsgs: number) => {
      console.log(`📨 ${numNewMsgs} new message(s) arrived for ${accountId}`);

      imapConnection.stopIdle((err: any) => {
        if (err) {
          console.error(`❌ Error stopping IDLE:`, err);
          this.setupIdleMode(imap, accountId);
          return;
        }

        imapConnection.search(['UNSEEN'], async (err: any, results: any) => {
          if (err || !results || results.length === 0) {
            this.setupIdleMode(imap, accountId);
            return;
          }

          console.log(`🔄 Fetching ${results.length} new message(s)...`);
          await this.fetchAndProcessNewEmails(imap, accountId, results);
          this.setupIdleMode(imap, accountId);
        });
      });
    });
  });
}


  private async fetchAndProcessNewEmails(
    imap: Imap,
    accountId: string,
    uids: number[]
  ): Promise<void> {
    return new Promise((resolve) => {
      this.fetchAndProcessEmails(imap, accountId, uids, resolve);
    });
  }

  private async reconnect(config: ImapAccount, attempt: number = 1): Promise<void> {
    const maxAttempts = 10;
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 60000);

    if (attempt > maxAttempts) {
      console.error(
        `❌ Max reconnection attempts (${maxAttempts}) reached for ${config.id}`
      );
      return;
    }

    console.log(
      `🔄 Reconnecting to ${config.id} in ${delay}ms (attempt ${attempt}/${maxAttempts})...`
    );

    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      await this.connectAccount(config);
    } catch (error) {
      await this.reconnect(config, attempt + 1);
    }
  }

  getConnectionStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    const accounts = ImapConfig.getAccounts();

    for (const account of accounts) {
      const imap = this.connections.get(account.id);
      status[account.id] = imap ? imap.state === 'authenticated' : false;
    }

    return status;
  }

  getTenantId(): string {
    return this.tenantId;
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down IMAP connections...');

    for (const [accountId, imap] of this.connections.entries()) {
      try {
        await new Promise<void>((resolve) => {
          imap.closeBox(false, (err) => {
            if (err) console.error(`Error closing INBOX for ${accountId}:`, err);
            imap.end();
            resolve();
          });
        });
        console.log(`✅ Closed connection for ${accountId}`);
      } catch (error) {
        console.error(`❌ Error closing ${accountId}:`, error);
      }
    }

    this.connections.clear();
    console.log('✅ IMAP Service shutdown complete');
  }
}

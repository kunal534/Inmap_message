"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImapService = void 0;
const imap_1 = __importDefault(require("imap"));
const mailparser_1 = require("mailparser");
const imap_config_1 = require("../config/imap.config");
class ImapService {
    constructor(elasticsearchService, aiCategorizationService, notificationService, tenantId = '') {
        this.connections = new Map();
        this.isInitialized = false;
        this.tenantId = '';
        this.esService = elasticsearchService;
        this.aiService = aiCategorizationService;
        this.notificationService = notificationService;
        this.tenantId = tenantId;
    }
    async initialize(tenantId) {
        if (this.isInitialized) {
            console.log('⚠️  IMAP Service already initialized');
            return;
        }
        if (tenantId) {
            this.tenantId = tenantId;
        }
        const accounts = imap_config_1.ImapConfig.getAccounts();
        console.log(`📧 Initializing ${accounts.length} IMAP accounts for tenant: ${this.tenantId}...`);
        for (const account of accounts) {
            try {
                await this.connectAccount(account);
                console.log(`✅ Connected to account: ${account.id}`);
            }
            catch (error) {
                console.error(`❌ Failed to connect account ${account.id}:`, error);
            }
        }
        this.isInitialized = true;
        console.log('✅ IMAP Service initialized successfully');
    }
    async connectAccount(config) {
        return new Promise((resolve, reject) => {
            const imap = new imap_1.default({
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
            imap.on('error', (err) => {
                console.error(`❌ IMAP error for ${config.id}:`, err.message);
                this.reconnect(config);
            });
            imap.once('end', () => {
                console.log(`🔌 IMAP connection ended for ${config.id}`);
                this.reconnect(config);
            });
            imap.on('alert', (message) => {
                console.warn(`⚠️  IMAP Alert for ${config.id}:`, message);
            });
            this.connections.set(config.id, imap);
            imap.connect();
        });
    }
    openInboxAndListen(imap, accountId) {
        imap.openBox('INBOX', false, async (err, box) => {
            if (err) {
                console.error(`❌ Error opening INBOX for ${accountId}:`, err);
                return;
            }
            console.log(`📬 INBOX opened for ${accountId}. Total messages: ${box.messages.total}`);
            await this.fetchRecentEmails(imap, accountId, 30);
            this.setupIdleMode(imap, accountId);
        });
    }
    async fetchRecentEmails(imap, accountId, days) {
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
                console.log(`📥 Found ${results.length} emails for ${accountId}, fetching...`);
                this.fetchAndProcessEmails(imap, accountId, results, resolve);
            });
        });
    }
    fetchAndProcessEmails(imap, accountId, uids, callback) {
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
    async processMessage(msg, seqno, accountId, folder) {
        let buffer = '';
        msg.on('body', (stream) => {
            stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
            });
            stream.once('end', async () => {
                try {
                    const parsed = await (0, mailparser_1.simpleParser)(buffer);
                    const email = {
                        messageId: parsed.messageId || `${accountId}-${seqno}-${Date.now()}`,
                        accountId,
                        tenantId: this.tenantId,
                        from: parsed.from?.text || parsed.from?.address || 'Unknown',
                        to: parsed.to?.text || parsed.to?.address || '',
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
                }
                catch (error) {
                    console.error(`❌ Error processing message ${seqno}:`, error);
                }
            });
        });
        msg.on('attributes', (attrs) => {
            // Handle email attributes if needed
        });
    }
    async indexEmailToElasticsearch(email) {
        await this.esService.indexEmail({
            ...email,
            category: 'Uncategorized',
            createdAt: new Date()
        });
    }
    async updateEmailCategory(email, category) {
        console.log(`🏷️  Categorized as: ${category}`);
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
    setupIdleMode(imap, accountId) {
        const imapConnection = imap;
        if (!imapConnection || typeof imapConnection.idle !== 'function') {
            console.log(`⚠️  IDLE not available for ${accountId}, retrying in 5s...`);
            setTimeout(() => this.setupIdleMode(imap, accountId), 5000);
            return;
        }
        imapConnection.idle((err) => {
            if (err) {
                console.error(`❌ IDLE error for ${accountId}:`, err.message);
                setTimeout(() => this.setupIdleMode(imap, accountId), 5000);
                return;
            }
            console.log(`⏱️  IDLE mode active for ${accountId}`);
            imapConnection.on('mail', (numNewMsgs) => {
                console.log(`📨 ${numNewMsgs} new message(s) arrived for ${accountId}`);
                imapConnection.stopIdle((err) => {
                    if (err) {
                        console.error(`❌ Error stopping IDLE:`, err);
                        this.setupIdleMode(imap, accountId);
                        return;
                    }
                    imapConnection.search(['UNSEEN'], async (err, results) => {
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
    async fetchAndProcessNewEmails(imap, accountId, uids) {
        return new Promise((resolve) => {
            this.fetchAndProcessEmails(imap, accountId, uids, resolve);
        });
    }
    async reconnect(config, attempt = 1) {
        const maxAttempts = 10;
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 60000);
        if (attempt > maxAttempts) {
            console.error(`❌ Max reconnection attempts (${maxAttempts}) reached for ${config.id}`);
            return;
        }
        console.log(`🔄 Reconnecting to ${config.id} in ${delay}ms (attempt ${attempt}/${maxAttempts})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        try {
            await this.connectAccount(config);
        }
        catch (error) {
            await this.reconnect(config, attempt + 1);
        }
    }
    getConnectionStatus() {
        const status = {};
        const accounts = imap_config_1.ImapConfig.getAccounts();
        for (const account of accounts) {
            const imap = this.connections.get(account.id);
            status[account.id] = imap ? imap.state === 'authenticated' : false;
        }
        return status;
    }
    getTenantId() {
        return this.tenantId;
    }
    async shutdown() {
        console.log('🛑 Shutting down IMAP connections...');
        for (const [accountId, imap] of this.connections.entries()) {
            try {
                await new Promise((resolve) => {
                    imap.closeBox(false, (err) => {
                        if (err)
                            console.error(`Error closing INBOX for ${accountId}:`, err);
                        imap.end();
                        resolve();
                    });
                });
                console.log(`✅ Closed connection for ${accountId}`);
            }
            catch (error) {
                console.error(`❌ Error closing ${accountId}:`, error);
            }
        }
        this.connections.clear();
        console.log('✅ IMAP Service shutdown complete');
    }
}
exports.ImapService = ImapService;
//# sourceMappingURL=ImapService.js.map
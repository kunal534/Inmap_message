"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailController = void 0;
class EmailController {
    static async getEmails(req, res) {
        try {
            const tenantId = req.tenantId;
            if (!tenantId) {
                return res.status(401).json({
                    success: false,
                    error: 'Unauthorized'
                });
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const accountId = req.query.accountId;
            const folder = req.query.folder;
            const category = req.query.category;
            const esService = req.esService;
            if (!esService) {
                return res.status(503).json({
                    success: false,
                    error: 'Elasticsearch service not available'
                });
            }
            const filters = {
                tenantId,
                accountId,
                folder,
                category,
                size: limit,
                from: (page - 1) * limit
            };
            const emails = await esService.searchEmails('', filters);
            res.json({
                success: true,
                data: emails,
                pagination: {
                    page,
                    limit,
                    total: emails.length
                }
            });
        }
        catch (error) {
            console.error('Error fetching emails:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch emails'
            });
        }
    }
    static async searchEmails(req, res) {
        try {
            const { query, filters } = req.body;
            const esService = req.esService;
            if (!esService) {
                return res.status(503).json({
                    success: false,
                    error: 'Elasticsearch service not available'
                });
            }
            const emails = await esService.searchEmails(query || '', filters || {});
            res.json({
                success: true,
                data: emails,
                total: emails.length
            });
        }
        catch (error) {
            console.error('Error searching emails:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to search emails'
            });
        }
    }
    static async getEmailById(req, res) {
        try {
            const { id } = req.params;
            const esService = req.esService;
            if (!esService) {
                return res.status(503).json({
                    success: false,
                    error: 'Elasticsearch service not available'
                });
            }
            const emails = await esService.searchEmails('', {});
            const email = emails.find((e) => e.messageId === id);
            if (!email) {
                return res.status(404).json({
                    success: false,
                    error: 'Email not found'
                });
            }
            res.json({
                success: true,
                data: email
            });
        }
        catch (error) {
            console.error('Error fetching email:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch email'
            });
        }
    }
    static async getCategoryStats(req, res) {
        try {
            const esService = req.esService;
            if (!esService) {
                return res.status(503).json({
                    success: false,
                    error: 'Elasticsearch service not available'
                });
            }
            const stats = await esService.getCategoryStats();
            res.json({
                success: true,
                data: stats || []
            });
        }
        catch (error) {
            console.error('Error fetching category stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch category stats'
            });
        }
    }
    static async triggerSync(req, res) {
        try {
            const { accountId } = req.body;
            const imapService = req.imapService;
            if (!imapService) {
                return res.status(503).json({
                    success: false,
                    error: 'IMAP service not available'
                });
            }
            await imapService.initialize();
            res.json({
                success: true,
                message: 'Sync triggered successfully'
            });
        }
        catch (error) {
            console.error('Error triggering sync:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to trigger sync'
            });
        }
    }
    static async getConnectionStatus(req, res) {
        try {
            const imapService = req.imapService;
            if (!imapService) {
                return res.status(503).json({
                    success: false,
                    error: 'IMAP service not available'
                });
            }
            const status = imapService.getConnectionStatus();
            res.json({
                success: true,
                data: status
            });
        }
        catch (error) {
            console.error('Error getting connection status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get connection status'
            });
        }
    }
}
exports.EmailController = EmailController;
//# sourceMappingURL=EmailController.js.map
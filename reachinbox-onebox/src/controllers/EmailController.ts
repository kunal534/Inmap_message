import { Request, Response } from 'express';

export class EmailController {
  static async getEmails(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const accountId = req.query.accountId as string;
      const folder = req.query.folder as string;
      const category = req.query.category as string;

      const esService = (req as any).esService;
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
    } catch (error) {
      console.error('Error fetching emails:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch emails'
      });
    }
  }

  static async searchEmails(req: Request, res: Response) {
    try {
      const { query, filters } = req.body;

      const esService = (req as any).esService;
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
    } catch (error) {
      console.error('Error searching emails:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search emails'
      });
    }
  }

  static async getEmailById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const esService = (req as any).esService;
      if (!esService) {
        return res.status(503).json({
          success: false,
          error: 'Elasticsearch service not available'
        });
      }

      const emails = await esService.searchEmails('', {});
      const email = emails.find((e: any) => e.messageId === id);

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
    } catch (error) {
      console.error('Error fetching email:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch email'
      });
    }
  }

  static async getCategoryStats(req: Request, res: Response) {
    try {
      const esService = (req as any).esService;
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
    } catch (error) {
      console.error('Error fetching category stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch category stats'
      });
    }
  }

  static async triggerSync(req: Request, res: Response) {
    try {
      const { accountId } = req.body;

      const imapService = (req as any).imapService;
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
    } catch (error) {
      console.error('Error triggering sync:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger sync'
      });
    }
  }

  static async getConnectionStatus(req: Request, res: Response) {
    try {
      const imapService = (req as any).imapService;
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
    } catch (error) {
      console.error('Error getting connection status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get connection status'
      });
    }
  }
}

import { Router, Request, Response } from 'express';

const router = Router();

router.post('/categorize', async (req: Request, res: Response) => {
  try {
    const { subject, from, text } = req.body;

    if (!subject || !from || !text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: subject, from, text'
      });
    }

    const aiService = (req as any).aiService;
    if (!aiService) {
      return res.status(503).json({
        success: false,
        error: 'AI service not available'
      });
    }

    const email = { subject, from, text, messageId: `test-${Date.now()}` };
    const category = await aiService.categorizeEmail(email);

    res.json({
      success: true,
      data: {
        category,
        email: { subject, from }
      }
    });
  } catch (error) {
    console.error('Error categorizing email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to categorize email'
    });
  }
});

router.post('/test', async (req: Request, res: Response) => {
  try {
    const aiService = (req as any).aiService;
    if (!aiService) {
      return res.status(503).json({
        success: false,
        error: 'AI service not available'
      });
    }

    const testEmail = {
      subject: 'Meeting Request - Let\'s Connect',
      from: 'contact@example.com',
      text: 'Hi, I\'m very interested in your product. Can we schedule a meeting next week?',
      messageId: `test-${Date.now()}`
    };

    const category = await aiService.categorizeEmail(testEmail);

    res.json({
      success: true,
      data: {
        message: 'Test categorization complete',
        testEmail,
        category
      }
    });
  } catch (error) {
    console.error('Error in test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run test'
    });
  }
});

export default router;

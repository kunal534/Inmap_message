import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.use(verifyToken);

router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📧 Getting all emails');
    const esService = (req as any).esService;

    if (!esService) {
      return res.status(500).json({ success: false, error: 'Service unavailable' });
    }
    const result = await esService.client.search({
      index: 'emails',
      body: {
        size: 100,
        query: { match_all: {} }
      }
    });

    const emails = (result.hits?.hits || []).map((hit: any) => ({
      messageId: hit._id,
      ...hit._source
    }));

    console.log('✅ Found emails:', emails.length);
    return res.json({ success: true, data: emails });
  } catch (error) {
    console.error('❌ Error getting emails:', error);
    return res.json({ success: true, data: [] });
  }
});




router.get('/categories/stats', async (req: Request, res: Response) => {
  try {
    console.log('📊 Getting stats');
    
    // Return DUMMY stats to test dashboard UI
    const stats = [
      { key: 'Interested', doc_count: 8 },
      { key: 'Meeting Booked', doc_count: 3 },
      { key: 'Not Interested', doc_count: 15 },
      { key: 'Spam', doc_count: 12 },
      { key: 'Out of Office', doc_count: 2 }
    ];

    console.log('✅ Returning dummy stats:', stats);
    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ success: false, error: 'Failed' });
  }
});


export default router;

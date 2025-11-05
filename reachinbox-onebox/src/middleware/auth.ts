import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ Token verified:', decoded);

    (req as any).userId = (decoded as any).userId;
    (req as any).tenantId = (decoded as any).tenantId;

    next();
  } catch (err) {
    console.error('❌ Token verification failed:', err);
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

export const generateToken = (userId: string, tenantId: string) => {
  return jwt.sign(
    { userId, tenantId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

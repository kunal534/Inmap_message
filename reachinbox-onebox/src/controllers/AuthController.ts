import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth';

const users = new Map<string, any>();

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, tenantId } = req.body;
      console.log('📝 Register attempt:', { email, tenantId });

      if (!email || !password || !tenantId) {
        console.error('❌ Missing fields');
        return res.status(400).json({
          success: false,
          error: 'Email, password, and tenantId are required'
        });
      }

      if (users.has(email)) {
        console.warn('⚠️  User already exists:', email);
        return res.status(400).json({
          success: false,
          error: 'User already exists'
        });
      }

      console.log('🔐 Hashing password...');
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('✅ Password hashed');

      users.set(email, { email, password: hashedPassword, tenantId });
      console.log('✅ User stored:', { email, tenantId });

      const token = generateToken(email, tenantId);
      console.log('✅ Token generated:', token.substring(0, 20) + '...');

      console.log('📤 Sending response...');
      return res.status(200).json({
        success: true,
        message: 'User registered successfully',
        data: { email, tenantId, token }
      });
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      return res.status(500).json({
        success: false,
        error: 'Registration failed'
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      console.log('🔑 Login attempt:', email);

      if (!email || !password) {
        console.error('❌ Missing email or password');
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      const user = users.get(email);

      if (!user) {
        console.warn('⚠️  User not found:', email);
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      console.log('✅ User found, comparing passwords...');
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        console.warn('⚠️  Password mismatch for:', email);
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      console.log('✅ Password matched');
      const token = generateToken(email, user.tenantId);
      console.log('✅ Token generated:', token.substring(0, 20) + '...');

      console.log('📤 Sending login response...');
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          email,
          tenantId: user.tenantId,
          token
        }
      });
      
    } catch (error) {
      console.error('❌ Login error:', error);
      return res.status(500).json({
        success: false,
        error: 'Login failed'
      });
    }
  }

  static getUsers(req: Request, res: Response) {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden'
      });
    }

    const userList = Array.from(users.entries()).map(([email, user]) => ({
      email,
      tenantId: user.tenantId
    }));

    return res.json({
      success: true,
      data: userList
    });
  }
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("../middleware/auth");
// Simple in-memory user store (use database in production)
const users = new Map();
class AuthController {
    static async register(req, res) {
        try {
            const { email, password, tenantId } = req.body;
            console.log('📝 Register attempt:', { email, tenantId });
            if (!email || !password || !tenantId) {
                console.error('❌ Missing fields:', { email: !!email, password: !!password, tenantId: !!tenantId });
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
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            console.log('✅ Password hashed');
            users.set(email, {
                email,
                password: hashedPassword,
                tenantId
            });
            console.log('✅ User stored:', { email, tenantId });
            const token = (0, auth_1.generateToken)(email, tenantId);
            console.log('✅ Token generated');
            res.json({
                success: true,
                message: 'User registered successfully',
                data: {
                    email,
                    tenantId,
                    token
                }
            });
        }
        catch (error) {
            console.error('❌ Registration error:', error);
            res.status(500).json({
                success: false,
                error: 'Registration failed',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    static async login(req, res) {
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
            const passwordMatch = await bcryptjs_1.default.compare(password, user.password);
            if (!passwordMatch) {
                console.warn('⚠️  Password mismatch for:', email);
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }
            console.log('✅ Password matched');
            const token = (0, auth_1.generateToken)(email, user.tenantId);
            console.log('✅ Token generated');
            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    email,
                    tenantId: user.tenantId,
                    token
                }
            });
        }
        catch (error) {
            console.error('❌ Login error:', error);
            res.status(500).json({
                success: false,
                error: 'Login failed',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    // Helper endpoint to see all users (dev only)
    static getUsers(req, res) {
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
        res.json({
            success: true,
            data: userList
        });
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map
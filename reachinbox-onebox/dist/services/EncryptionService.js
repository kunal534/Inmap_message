"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        const keyString = process.env.ENCRYPTION_KEY || 'default-encryption-key-please-change-in-production';
        this.secretKey = crypto_1.default.scryptSync(keyString, 'salt', 32);
    }
    encrypt(text) {
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv(this.algorithm, this.secretKey, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // Cast to any to access getAuthTag
        const authTag = cipher.getAuthTag();
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }
    decrypt(encrypted, iv, authTag) {
        const decipher = crypto_1.default.createDecipheriv(this.algorithm, this.secretKey, Buffer.from(iv, 'hex'));
        // Cast to any to access setAuthTag
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
exports.EncryptionService = EncryptionService;
//# sourceMappingURL=EncryptionService.js.map
export declare class EncryptionService {
    private algorithm;
    private secretKey;
    constructor();
    encrypt(text: string): {
        encrypted: string;
        iv: string;
        authTag: string;
    };
    decrypt(encrypted: string, iv: string, authTag: string): string;
}

export interface ImapAccount {
    id: string;
    user: string;
    password: string;
    host: string;
    port: number;
    tls: boolean;
}
export declare class ImapConfig {
    static getAccounts(): ImapAccount[];
}

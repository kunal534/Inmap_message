export interface ImapAccount {
  id: string;
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

export class ImapConfig {
  static getAccounts(): ImapAccount[] {
    return [
      {
        id: 'account_1',
        user: process.env.IMAP_ACCOUNT_1_USER!,
        password: process.env.IMAP_ACCOUNT_1_PASSWORD!,
        host: process.env.IMAP_ACCOUNT_1_HOST!,
        port: Number(process.env.IMAP_ACCOUNT_1_PORT),
        tls: process.env.IMAP_ACCOUNT_1_TLS === 'true'
      },
      {
        id: 'account_2',
        user: process.env.IMAP_ACCOUNT_2_USER!,
        password: process.env.IMAP_ACCOUNT_2_PASSWORD!,
        host: process.env.IMAP_ACCOUNT_2_HOST!,
        port: Number(process.env.IMAP_ACCOUNT_2_PORT),
        tls: process.env.IMAP_ACCOUNT_2_TLS === 'true'
      }
    ];
  }
}

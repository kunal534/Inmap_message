import { Request, Response } from 'express';
export declare class EmailController {
    static getEmails(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static searchEmails(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getEmailById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getCategoryStats(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static triggerSync(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getConnectionStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}

import { Injectable } from '@nestjs/common';
import * as nodemailerImport from 'nodemailer';
type Transporter = typeof nodemailerImport.createTransport extends (
  ...args: any[]
) => infer T
  ? T
  : never;
type SentMessageInfo = any; // fallback for type issues

@Injectable()
export class MailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = (nodemailerImport.createTransport as any)({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
  }

  async sendMail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<{
    success: boolean;
    info?: SentMessageInfo;
    error?: unknown;
  }> {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject,
      text,
      html,
    };
    try {
      const info = await (this.transporter.sendMail as any)(mailOptions);
      return { success: true, info };
    } catch (error) {
      return { success: false, error };
    }
  }
}

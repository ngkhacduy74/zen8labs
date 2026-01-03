import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async sendVerifyEmail(to: string, verifyLink: string) {
    await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject: 'Xác minh email đăng ký',
      html: `
        <p>Chào bạn,</p>
        <p>Vui lòng bấm link để xác minh email:</p>
        <p><a href="${verifyLink}">Xác minh email</a></p>
        <p>Link sẽ hết hạn sau 30 phút.</p>
      `,
    });
  }
}

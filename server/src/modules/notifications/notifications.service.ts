import { Injectable, Logger } from '@nestjs/common';

/**
 * NotificationsService — PLACEHOLDER
 * Methods are stubbed and log intent to console.
 * Replace with real email/SMS/in-app delivery when ready.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendEmail(to: string, subject: string, body: string) {
    this.logger.log(`[EMAIL STUB] To: ${to} | Subject: ${subject}`);
    // TODO: Integrate with nodemailer / SendGrid / Resend
  }

  async sendInApp(userId: string, message: string) {
    this.logger.log(`[IN-APP STUB] UserId: ${userId} | Message: ${message}`);
    // TODO: Integrate with WebSocket gateway or notification table
  }
}

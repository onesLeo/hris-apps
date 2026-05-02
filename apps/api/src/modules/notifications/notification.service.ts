import { Injectable } from '@nestjs/common';
import { StructuredLoggerService } from '../../common/logging/structured-logger.service';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class NotificationService {
  constructor(private readonly logger: StructuredLoggerService) {
    this.logger.setContext('NotificationService');
  }

  async sendEmail(payload: EmailPayload): Promise<void> {
    try {
      // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
      // For now, just log the email
      this.logger.log('email would be sent', {
        to: payload.to,
        subject: payload.subject,
      });
    } catch (error) {
      this.logger.error('failed to send email', {
        to: payload.to,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  buildApprovalRequestEmail(data: {
    approverName: string;
    approverEmail: string;
    requestType: string;
    employeeName: string;
    requestDetails: string;
    slaHours: number;
    dueDateStr: string;
    workflowLink: string;
  }): EmailPayload {
    const html = `
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1f2937; margin: 0 0 16px 0;">New Approval Request: ${data.requestType}</h2>

            <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 12px 0;"><strong>Employee:</strong> ${data.employeeName}</p>
              <p style="margin: 0 0 12px 0;"><strong>Request Type:</strong> ${data.requestType}</p>
              <p style="margin: 0 0 12px 0;"><strong>Details:</strong> ${data.requestDetails}</p>
              <p style="margin: 0;"><strong>SLA:</strong> ${data.slaHours} hours (Due: ${data.dueDateStr})</p>
            </div>

            <div style="margin: 20px 0;">
              <p style="margin: 0 0 12px 0;">Please review and take action on this request.</p>
              <a href="${data.workflowLink}" style="display: inline-block; padding: 12px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Review Request
              </a>
            </div>

            <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">
              This is an automated notification. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    return {
      to: data.approverEmail,
      subject: `New Approval: ${data.requestType} - ${data.employeeName}`,
      html,
      text: `New Approval Request: ${data.requestType}\n\nEmployee: ${data.employeeName}\nDetails: ${data.requestDetails}\nSLA: ${data.slaHours} hours`,
    };
  }

  buildSLAReminderEmail(data: {
    approverName: string;
    approverEmail: string;
    requestType: string;
    employeeName: string;
    hoursRemaining: number;
    dueDate: string;
    workflowLink: string;
  }): EmailPayload {
    const html = `
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc2626; margin: 0 0 16px 0;">⏰ SLA Reminder: ${data.requestType}</h2>

            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 12px 0;"><strong>Employee:</strong> ${data.employeeName}</p>
              <p style="margin: 0 0 12px 0;"><strong>Request:</strong> ${data.requestType}</p>
              <p style="margin: 0 0 12px 0; color: #dc2626;"><strong>Time Remaining:</strong> ${data.hoursRemaining} hour(s)</p>
              <p style="margin: 0;"><strong>Due:</strong> ${data.dueDate}</p>
            </div>

            <p style="margin: 20px 0 0 0;">Please complete your review before the SLA expires.</p>
            <a href="${data.workflowLink}" style="display: inline-block; margin-top: 12px; padding: 12px 20px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Review Now
            </a>

            <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">
              This is an automated notification. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    return {
      to: data.approverEmail,
      subject: `⏰ SLA Reminder: ${data.requestType} - ${data.employeeName}`,
      html,
      text: `SLA Reminder: ${data.requestType}\n\nEmployee: ${data.employeeName}\nTime Remaining: ${data.hoursRemaining} hour(s)\nDue: ${data.dueDate}`,
    };
  }
}

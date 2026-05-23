import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private brevoApiKey: string;
  private senderEmail: string;
  private senderName: string;

  constructor(private config: ConfigService) {
    this.brevoApiKey = this.config.get('BREVO_API_KEY')!;
    this.senderEmail = this.config.get('BREVO_SENDER_EMAIL')!;
    this.senderName = this.config.get('BREVO_SENDER_NAME')!;
  }

  async sendInvitationEmail(
    to: string,
    inviterName: string,
    workspaceName: string,
    invitationToken: string,
  ) {
    const invitationUrl = `${this.config.get('FRONTEND_URL')}/join?token=${invitationToken}`;

    const emailData = {
      sender: {
        name: this.senderName,
        email: this.senderEmail,
      },
      to: [{ email: to }],
      subject: `${inviterName} invited you to join ${workspaceName} on ClearLoop`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to join ${workspaceName}</h2>
          <p>${inviterName} has invited you to collaborate on ClearLoop.</p>
          <p>
            <a href="${invitationUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This invitation will expire in 7 days.
          </p>
          <p style="color: #666; font-size: 12px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.brevoApiKey,
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        throw new Error(`Brevo API error: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }
}

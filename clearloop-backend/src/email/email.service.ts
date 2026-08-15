import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private brevoApiKey: string;
  private senderEmail: string;
  private senderName: string;
  private frontendUrl: string;

  constructor(private config: ConfigService) {
    this.brevoApiKey = this.config.get('BREVO_API_KEY')!;
    this.senderEmail = this.config.get('BREVO_SENDER_EMAIL')!;
    this.senderName = this.config.get('BREVO_SENDER_NAME')!;
    this.frontendUrl = this.config.get('FRONTEND_URL')!;
    if (!this.frontendUrl) {
      throw new Error('FRONTEND_URL is required');
    }
  }

  async sendInvitationEmail(
    to: string,
    inviterName: string,
    workspaceName: string,
    invitationToken: string,
  ) {
    const invitationUrl = `${this.frontendUrl}/join?token=${invitationToken}`;

    const safeInviterName = this.escapeHtml(inviterName);
    const safeWorkspaceName = this.escapeHtml(workspaceName);

    return this.send({
      to,
      subject: `${safeInviterName} invited you to join ${safeWorkspaceName} on ClearLoop`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to join ${safeWorkspaceName}</h2>
          <p>${safeInviterName} has invited you to collaborate on ClearLoop.</p>
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
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string, name?: string) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const greeting = name ? `Hi ${this.escapeHtml(name)},` : 'Hi,';

    return this.send({
      to,
      subject: 'Reset your ClearLoop password',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset your password</h2>
          <p>${greeting}</p>
          <p>We received a request to reset the password for your ClearLoop account.</p>
          <p>
            <a href="${resetUrl}"
               style="background-color: #4F46E5; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour and can only be used once.
          </p>
          <p style="color: #666; font-size: 12px;">
            If you didn't request a password reset, you can safely ignore this
            email — your password will not change.
          </p>
        </div>
      `,
    });
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private async send(params: {
    to: string;
    subject: string;
    htmlContent: string;
  }) {
    const emailData = {
      sender: {
        name: this.senderName,
        email: this.senderEmail,
      },
      to: [{ email: params.to }],
      subject: params.subject,
      htmlContent: params.htmlContent,
    };

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        signal: AbortSignal.timeout(10_000),
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.brevoApiKey,
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorBody = await response.text();

        throw new Error(
          `Brevo API error: ${response.status} ${response.statusText} - ${errorBody}`,
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }
}

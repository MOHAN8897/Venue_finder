export interface DraftRecoveryEmailData {
  to: string;
  venueName: string;
  draftId: string;
  recoveryLink: string;
}

export interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export class EmailService {
  /**
   * Send draft recovery email
   */
  static async sendDraftRecoveryEmail(data: DraftRecoveryEmailData): Promise<EmailResponse> {
    try {
      // In a real implementation, this would integrate with an email service
      // For now, we'll simulate the email sending and log the details
      
      const emailContent = this.generateDraftRecoveryEmail(data);
      
      console.log('Sending draft recovery email:', {
        to: data.to,
        subject: 'Continue Your Venue Listing - Draft Recovery',
        content: emailContent
      });

      // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
      // Example with SendGrid:
      // const response = await fetch('/api/send-email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     to: data.to,
      //     subject: 'Continue Your Venue Listing - Draft Recovery',
      //     html: emailContent
      //   })
      // });
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Draft recovery email sent successfully'
      };
    } catch (error) {
      console.error('Error sending draft recovery email:', error);
      return {
        success: false,
        error: 'Failed to send draft recovery email'
      };
    }
  }

  /**
   * Generate draft recovery email HTML content
   */
  private static generateDraftRecoveryEmail(data: DraftRecoveryEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Continue Your Venue Listing</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏢 Continue Your Venue Listing</h1>
            <p>Your draft is ready to be completed!</p>
          </div>
          
          <div class="content">
            <h2>Hello!</h2>
            <p>We noticed you started listing your venue <strong>"${data.venueName}"</strong> but didn't finish. Don't worry - your progress has been saved!</p>
            
            <div class="highlight">
              <strong>📝 Your draft is waiting for you</strong><br>
              Click the button below to continue where you left off and complete your venue listing.
            </div>
            
            <div style="text-align: center;">
              <a href="${data.recoveryLink}" class="button">Continue Listing My Venue</a>
            </div>
            
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Complete your venue details</li>
              <li>Upload photos and videos</li>
              <li>Submit for review</li>
              <li>Start receiving bookings!</li>
            </ul>
            
            <p><strong>Need help?</strong> Reply to this email or contact our support team.</p>
            
            <div class="footer">
              <p>This link will expire in 7 days for security reasons.</p>
              <p>© 2024 VenueFinder. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send venue submission confirmation email
   */
  static async sendVenueSubmissionConfirmation(
    email: string, 
    venueName: string, 
    venueId: string
  ): Promise<EmailResponse> {
    try {
      console.log('Sending venue submission confirmation:', {
        to: email,
        venueName,
        venueId
      });

      // TODO: Implement actual email sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Venue submission confirmation sent'
      };
    } catch (error) {
      console.error('Error sending venue submission confirmation:', error);
      return {
        success: false,
        error: 'Failed to send confirmation email'
      };
    }
  }

  /**
   * Send venue approval notification
   */
  static async sendVenueApprovalNotification(
    email: string, 
    venueName: string, 
    venueId: string
  ): Promise<EmailResponse> {
    try {
      console.log('Sending venue approval notification:', {
        to: email,
        venueName,
        venueId
      });

      // TODO: Implement actual email sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Venue approval notification sent'
      };
    } catch (error) {
      console.error('Error sending venue approval notification:', error);
      return {
        success: false,
        error: 'Failed to send approval notification'
      };
    }
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
} 
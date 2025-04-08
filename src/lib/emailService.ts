import { supabase } from './supabase';

// Email interface
export interface EmailParams {
  /**
   * Email recipient(s)
   * Can be a string or array of strings
   */
  to: string | string[];
  
  /**
   * Email subject line
   */
  subject: string;
  
  /**
   * HTML content of the email (optional if text is provided)
   */
  html?: string;
  
  /**
   * Plain text content of the email (optional if html is provided)
   */
  text?: string;
  
  /**
   * Email sender address (optional, will use default if not provided)
   */
  from?: string;
}

/**
 * Send an email notification using Supabase Edge Function
 * @param params Email parameters
 * @returns Response from the email service
 */
export async function sendEmail(params: EmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Validate required fields
    if (!params.to || !params.subject || (!params.html && !params.text)) {
      throw new Error('Missing required email fields (to, subject, and either html or text)');
    }

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: params,
    });

    if (error) {
      console.error('Error invoking send-email function:', error);
      return { success: false, error: error.message };
    }

    return data || { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Create an email with a template for notifications
 * @param to Recipient email address
 * @param subject Email subject
 * @param content Main content of the email
 * @param buttonText Optional call-to-action button text
 * @param buttonUrl Optional call-to-action button URL
 * @returns Email parameters object ready to be sent
 */
export function createNotificationEmail(
  to: string | string[],
  subject: string,
  content: string,
  buttonText?: string,
  buttonUrl?: string
): EmailParams {
  // Create HTML content with simple responsive design
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6;
          color: #333333;
          margin: 0;
          padding: 0;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px;
        }
        .header { 
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-bottom: 1px solid #eeeeee;
        }
        .content { 
          padding: 20px; 
          background-color: #ffffff;
        }
        .button {
          display: ${buttonText && buttonUrl ? 'inline-block' : 'none'};
          padding: 10px 20px;
          margin: 20px 0;
          background-color: #4a76a8;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
        }
        .footer { 
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #999999;
          background-color: #f8f9fa;
          border-top: 1px solid #eeeeee;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${subject}</h2>
        </div>
        <div class="content">
          ${content}
          ${buttonText && buttonUrl 
            ? `<div style="text-align: center;">
                <a href="${buttonUrl}" class="button">${buttonText}</a>
               </div>` 
            : ''}
        </div>
        <div class="footer">
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Create plain text version for email clients that don't support HTML
  const textContent = `
${subject}

${content}

${buttonText && buttonUrl ? `${buttonText}: ${buttonUrl}` : ''}

This is an automated notification. Please do not reply to this email.
  `;

  return {
    to,
    subject,
    html: htmlContent,
    text: textContent
  };
} 
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY is not set. Email functionality will not work.');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: any[];
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('Cannot send email: SENDGRID_API_KEY is not set');
    return false;
  }

  try {
    const msg = {
      to: options.to,
      from: 'notifications@mintenance.app', // Change this to your verified sender
      subject: options.subject,
      text: options.text || '',
      html: options.html || '',
      attachments: options.attachments || [],
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Generate HTML email for completed job sheet
 */
export function generateJobCompletionEmail(
  jobTitle: string,
  contractorName: string,
  completionDate: Date,
  jobSheetUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Job Completed</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #3EB489;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 5px 5px;
        }
        .button {
          display: inline-block;
          background-color: #004080;
          color: white;
          text-decoration: none;
          padding: 12px 20px;
          border-radius: 4px;
          margin-top: 20px;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          color: #888;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Job Completed</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>We're happy to inform you that your job <strong>"${jobTitle}"</strong> has been completed by ${contractorName} on ${completionDate.toLocaleDateString()}.</p>
        <p>A detailed job sheet has been created with all the work performed, materials used, and photos of the completed work.</p>
        <p>Please review the job sheet and provide any feedback.</p>
        <div style="text-align: center;">
          <a href="${jobSheetUrl}" class="button">View Job Sheet</a>
        </div>
        <p>Thank you for using Mintenance!</p>
      </div>
      <div class="footer">
        <p>&copy; 2025 Mintenance. All rights reserved.</p>
        <p>This email was sent to you because you have a job on the Mintenance platform.</p>
      </div>
    </body>
    </html>
  `;
}
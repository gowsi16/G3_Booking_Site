const nodemailer = require('nodemailer');

function getMailerConfig() {
  const user = (process.env.GMAIL_USER || '').trim();
  const rawPass = (process.env.GMAIL_APP_PASSWORD || '').trim();
  const pass = rawPass.replace(/\s+/g, '');
  const isConfigured = user && pass && pass !== 'your_16_digit_google_app_password';

  return { user, pass, isConfigured };
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return 'admin email';
  const [name, domain] = email.split('@');
  if (name.length <= 2) {
    return `${name[0]}***@${domain}`;
  }
  return `${name[0]}${'*'.repeat(Math.min(name.length - 2, 4))}${name.slice(-1)}@${domain}`;
}

async function sendAdminOtpEmail(toEmail, otpCode) {
  const { user, pass, isConfigured } = getMailerConfig();

  // Print OTP to server console for guaranteed local visibility / testing
  console.log('--------------------------------------------------');
  console.log(`[ADMIN OTP NOTIFICATION]`);
  console.log(`Recipient Email: ${toEmail}`);
  console.log(`6-Digit OTP Code: ${otpCode}`);
  console.log(`Valid for: 5 Minutes (Max 5 Attempts)`);
  console.log('--------------------------------------------------');

  if (!isConfigured) {
    return {
      sent: false,
      devMode: true,
      reason: 'GMAIL_APP_PASSWORD not set or using placeholder in backend/.env',
      otp: otpCode // Available for local dev fallback
    };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>G3 Transport Admin Portal OTP</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background: #0f172a; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 22px; font-weight: bold; margin: 0; letter-spacing: -0.5px;">G3 Transport</h1>
          <p style="color: #f59e0b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin: 4px 0 0;">Authorized Dispatch Portal</p>
        </div>
        <div style="padding: 32px 24px; text-align: center;">
          <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px;">Admin Login Verification</h2>
          <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin: 0 0 24px;">
            A login request was initiated for the G3 Transport Admin Portal. Use the following 6-digit One-Time Password (OTP) to complete authentication:
          </p>
          <div style="background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 12px; padding: 18px 24px; display: inline-block; margin-bottom: 24px;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #b45309; letter-spacing: 8px;">
              ${otpCode}
            </span>
          </div>
          <div style="background: #f1f5f9; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #475569; margin-bottom: 24px; text-align: left;">
            <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Valid for <strong>5 minutes</strong> only.</li>
              <li>Maximum <strong>5 attempts</strong> allowed.</li>
              <li>Never share this verification code with anyone.</li>
            </ul>
          </div>
          <p style="font-size: 12px; color: #94a3b8; line-height: 1.4; margin: 0;">
            If you did not attempt this login, please change your master password and review system audit logs immediately.
          </p>
        </div>
        <div style="background: #f8fafc; border-top: 1px solid #f1f5f9; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
          &copy; ${new Date().getFullYear()} G3 Transport, Salem. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"G3 Transport Admin Portal" <${user}>`,
      to: toEmail,
      subject: `[${otpCode}] G3 Transport Admin Verification OTP`,
      text: `Your G3 Transport admin verification OTP is ${otpCode}. It expires in 5 minutes.`,
      html: htmlContent
    });
    console.log(`[ADMIN OTP] Successfully sent email to ${toEmail}`);
    return { sent: true };
  } catch (err) {
    console.error(`[ADMIN OTP ERROR] Failed to send email via Gmail SMTP:`, err.message);
    return {
      sent: false,
      devMode: true,
      error: err.message,
      otp: otpCode // Available for local dev fallback
    };
  }
}

module.exports = {
  sendAdminOtpEmail,
  maskEmail,
  getMailerConfig
};

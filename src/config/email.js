// src/config/email.js
const nodemailer = require('nodemailer');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send email utility function
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email
 * @param {String} options.subject - Email subject
 * @param {String} options.html - Email HTML content
 * @param {String} [options.text] - Plain text version (optional)
 * @returns {Promise} Email send result
 */
const sendEmail = async (options) => {
  try {
    const { to, subject, html, text } = options;
    
    const mailOptions = {
      from: `TradesPerson Platform <${process.env.EMAIL_USERNAME}>`,
      to,
      subject,
      html,
      text: text || convertHtmlToText(html)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

/**
 * Simple HTML to text converter
 * @param {String} html - HTML content
 * @returns {String} Plain text
 */
const convertHtmlToText = (html) => {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Email templates
 */
const emailTemplates = {
  // Verification email template
  verificationEmail: (name, verificationUrl) => ({
    subject: 'Verify Your TradesPerson Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4CAF50;">TradesPerson Platform</h1>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 5px;">
          <h2>Email Verification</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering with TradesPerson Platform. To complete your registration, please verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Verify My Email
            </a>
          </div>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create an account, please disregard this email.</p>
        </div>
        <div style="margin-top: 20px; font-size: 12px; color: #666; text-align: center;">
          <p>TradesPerson Platform | Connecting quality tradespeople with customers</p>
        </div>
      </div>
    `
  }),
  
  // Password reset template
  passwordResetEmail: (name, resetUrl) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4CAF50;">TradesPerson Platform</h1>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 5px;">
          <h2>Password Reset</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
        <div style="margin-top: 20px; font-size: 12px; color: #666; text-align: center;">
          <p>TradesPerson Platform | Connecting quality tradespeople with customers</p>
        </div>
      </div>
    `
  }),
  
  // Welcome email after verification
  welcomeEmail: (name, role) => ({
    subject: 'Welcome to TradesPerson Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4CAF50;">TradesPerson Platform</h1>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 5px;">
          <h2>Welcome!</h2>
          <p>Hello ${name},</p>
          <p>Thank you for verifying your email. Your account is now ${role === 'customer' ? 'active' : 'under review'}.</p>
          ${role === 'customer' 
            ? `<p>You can now start browsing and posting jobs to find the perfect tradesperson for your needs.</p>` 
            : `<p>Our team is reviewing your credentials. Once approved, you'll be able to access jobs and start building your profile.</p>`
          }
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/login" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Get Started
            </a>
          </div>
        </div>
        <div style="margin-top: 20px; font-size: 12px; color: #666; text-align: center;">
          <p>TradesPerson Platform | Connecting quality tradespeople with customers</p>
        </div>
      </div>
    `
  })
};

module.exports = {
  sendEmail,
  emailTemplates
};
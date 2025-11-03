const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send email
const sendEmail = async (options) => {
  const transporter = createTransporter();

  const message = {
    from: process.env.EMAIL_FROM,
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  await transporter.sendMail(message);
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  const html = `
    <h1>Password Reset Request</h1>
    <p>You have requested a password reset for your EventHub account.</p>
    <p>Please click the link below to reset your password:</p>
    <a href="${resetUrl}" target="_blank">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
    <p>If you did not request this, please ignore this email.</p>
  `;

  await sendEmail({
    email,
    subject: 'Password Reset - EventHub',
    html
  });
};

// Send verification email
const sendVerificationEmail = async (email, verificationToken, verificationUrl) => {
  const html = `
    <h1>Email Verification</h1>
    <p>Thank you for registering with EventHub!</p>
    <p>Please click the link below to verify your email address:</p>
    <a href="${verificationUrl}" target="_blank">Verify Email</a>
    <p>This link will expire in 24 hours.</p>
  `;

  await sendEmail({
    email,
    subject: 'Verify Your Email - EventHub',
    html
  });
};

// Send event registration confirmation
const sendEventRegistrationEmail = async (email, userName, eventTitle, eventDate) => {
  const html = `
    <h1>Event Registration Confirmed</h1>
    <p>Hi ${userName},</p>
    <p>You have successfully registered for the event:</p>
    <h2>${eventTitle}</h2>
    <p><strong>Date:</strong> ${new Date(eventDate).toLocaleString()}</p>
    <p>We look forward to seeing you there!</p>
  `;

  await sendEmail({
    email,
    subject: `Event Registration Confirmed - ${eventTitle}`,
    html
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendEventRegistrationEmail
};

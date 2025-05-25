require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

const PORT = process.env.PORT || 3000;
const API_SECRET_KEY = process.env.API_SECRET_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // do not fail on invalid certs if your SMTP provider uses self-signed certs (not common for public providers)
    // rejectUnauthorized: false,
    // ciphers: process.env.SMTP_TLS_CIPHERS, // Optional: e.g., 'SSLv3'
  },
  requireTLS: process.env.SMTP_REQUIRE_TLS === 'true' // Optional: force TLS
});

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- Routes ---
app.get('/', (req, res) => {
  res.status(200).send('Turisti Email Service is running!');
});

app.post('/send-email', async (req, res) => {
  const { to, subject, html, text, secret } = req.body;

  // 1. Authenticate the request
  if (secret !== API_SECRET_KEY) {
    console.warn('Unauthorized attempt to send email. Invalid API secret.');
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // 2. Validate essential payload
  if (!to || !subject || !html) {
    console.warn('Bad request to send email. Missing required fields.');
    return res.status(400).json({ 
      success: false, 
      message: 'Bad Request: Missing required fields (to, subject, html).' 
    });
  }

  // 3. Configure email options
  const mailOptions = {
    from: FROM_EMAIL, // Sender address (e.g., "Your Name <you@example.com>")
    to: to, // List of recipients
    subject: subject, // Subject line
    text: text, // Plain text body (optional)
    html: html, // HTML body
  };

  // 4. Send the email
  try {
    console.log(`Attempting to send email to: ${to} with subject: ${subject}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info)); // Only if using ethereal.email for testing
    res.status(200).json({ success: true, message: 'Email sent successfully!', messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to send email.', error: error.message });
  }
});

// --- Start the server ---
app.listen(PORT, () => {
  console.log(`Turisti Email Service listening on port ${PORT}`);
  if (!API_SECRET_KEY) {
    console.warn('WARNING: API_SECRET_KEY is not set. The /send-email endpoint will not be secure.');
  }
  if (!process.env.SMTP_HOST) {
    console.warn('WARNING: SMTP configuration is missing. Email sending will likely fail.');
  }
}); 
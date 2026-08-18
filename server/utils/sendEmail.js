import nodemailer from "nodemailer";

// Sends an email via Gmail (or any nodemailer-compatible SMTP provider).
// For Gmail you need an App Password — not your regular account password.
// Generate one at: https://myaccount.google.com/apppasswords
//
// options: { email, subject, message }

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"Mega Himalaya" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: options.html,   // uncomment when you have an HTML template
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;

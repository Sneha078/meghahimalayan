import transporter, { EMAIL_FROM } from "../config/email.js";
/*
 * Generic email sender.
 *
 * This file knows HOW to send an email.
 * It does not know WHY the email is being sent.
 */
const sendEmail = async ({
  email,
  subject,
  text,
  html,
}) => {
  if (!email) {
    throw new Error("Recipient email is required");
  }

  if (!subject) {
    throw new Error("Email subject is required");
  }

  if (!text && !html) {
    throw new Error(
      "Email must contain text or HTML content"
    );
  }

  const info = await transporter.sendMail({
    from: `"Mega Himalaya" <${EMAIL_FROM}>`,
    to: email,
    subject,
    text,
    html,
  });

  return info;
};

export default sendEmail;
import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

if (!EMAIL_USER || !EMAIL_PASSWORD) {
  console.warn(
    "Email configuration is incomplete. EMAIL_USER and EMAIL_PASSWORD are required."
  );
}

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

/*
 * Verify SMTP configuration when the server starts.
 *
 * This intentionally does not crash the application.
 * An email provider outage should not make the API unavailable.
 */
transporter
  .verify()
  .then(() => {
    console.log("Email transporter is ready");
  })
  .catch((error) => {
    console.error(
      "Email transporter verification failed:",
      error.message
    );
  });

export { EMAIL_FROM };

export default transporter;
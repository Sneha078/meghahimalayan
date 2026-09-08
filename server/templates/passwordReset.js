import {
  baseTemplate,
  styles,
  escapeHtml,
} from "./emailStyles.js";

export const passwordResetTemplate = ({
  user,
  resetURL,
}) => {
  const safeName = escapeHtml(
    user?.name || "there"
  );

  const safeResetURL = escapeHtml(resetURL);

  const baseUrlFromLink = (() => {
    try {
      return new URL(resetURL).origin;
    } catch {
      return "";
    }
  })();

  const content = `
    <h2 style="${styles.h2}">
      Password Reset Request
    </h2>

    <p style="${styles.p}">
      Hi ${safeName},
    </p>

    <p style="${styles.p}">
      You requested a password reset for your
      Mega Himalaya account.
    </p>

    <p style="${styles.p}">
      Click the button below to reset your password.
      This link expires in <strong>30 minutes</strong>.
    </p>

    <div style="text-align:center;">
      <a
        href="${safeResetURL}"
        style="${styles.button}"
      >
        Reset Password
      </a>
    </div>

    <p style="${styles.small}">
      Or copy this link into your browser:
    </p>

    <p
      style="
        ${styles.small};
        word-break: break-all;
      "
    >
      <a
        href="${safeResetURL}"
        style="color:#2563EB;"
      >
        ${safeResetURL}
      </a>
    </p>

    <div
      style="
        border-top:1px solid #e2e8f0;
        margin:24px 0;
      "
    ></div>

    <p style="${styles.small}">
      If you did not request this password reset,
      you can safely ignore this email.
      Your password will not change.
    </p>
  `;

  return baseTemplate(content, baseUrlFromLink);
};
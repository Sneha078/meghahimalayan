import {
  baseTemplate,
  styles,
  escapeHtml,
} from "./emailStyles.js";

export const welcomeTemplate = ({ user, frontendUrl }) => {
  const userName = escapeHtml(user?.name || "there");

  const content = `
    <h2 style="${styles.h2}">
      Welcome to Mega Himalaya, ${userName}
    </h2>

    <p style="${styles.p}">
      Thank you for creating your Mega Himalaya account.
      Your account has been successfully created.
    </p>

    <div style="${styles.box}">
      <div style="${styles.boxTitle}">
        Your Account
      </div>

      <p style="${styles.p};margin:4px 0;">
        You can now sign in to your account, manage your profile,
        browse our products, and place orders.
      </p>
    </div>

    <div style="text-align:center;">
      <a
        href="${frontendUrl}"
        style="${styles.button}"
      >
        Visit Mega Himalaya
      </a>
    </div>

    <p style="${styles.small}">
      If you did not create this account, please contact our support
      team.
    </p>
  `;

  return baseTemplate(content, frontendUrl);
};
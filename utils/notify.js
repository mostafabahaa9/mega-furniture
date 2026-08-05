const { read } = require("./db");
const { sendMail } = require("./mail");

function getNotifyEmails() {
  const settings = read("settings") || {};
  if (settings.notifyEmails && settings.notifyEmails.length)
    return settings.notifyEmails;
  return process.env.ADMIN_NOTIFY_EMAIL ? [process.env.ADMIN_NOTIFY_EMAIL] : [];
}

async function notifyAdmin({ subject, html, text }) {
  const emails = getNotifyEmails();
  if (!emails.length) return;
  return sendMail({ to: emails, subject, html, text }).catch((e) =>
    console.error("[notify] admin notify failed:", e.message),
  );
}

module.exports = { getNotifyEmails, notifyAdmin };

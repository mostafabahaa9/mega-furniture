const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function parseFrom(fromStr) {
  // "Name <email>" → { name, email }  or just "email"
  const match = fromStr && fromStr.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { email: fromStr || "" };
}

async function sendMail({ to, subject, text, html, bcc }) {
  if (!to || !subject) return { skipped: true };

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("[mail] BREVO_API_KEY not set — skipping");
    return { skipped: true };
  }

  const fromStr =
    process.env.SMTP_FROM ||
    `Mega Furniture <${process.env.SMTP_USER || "noreply@example.com"}>`;

  const toArr = Array.isArray(to) ? to.map(e => typeof e === 'string' ? { email: e.trim() } : e) : [{ email: String(to).trim() }];

  const body = {
    sender: parseFrom(fromStr),
    to: toArr,
    subject,
  };

  if (html) body.htmlContent = html;
  if (text) body.textContent = text;

  if (bcc) {
    const bccList = Array.isArray(bcc)
      ? bcc
      : bcc.split(",").map((e) => e.trim());
    body.bcc = bccList.map((email) => ({ email }));
  }

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo API ${res.status}: ${err}`);
  }

  const data = await res.json();
  console.log("[mail] sent to:", to, "| msgId:", data.messageId);
  return { sent: true, messageId: data.messageId };
}

module.exports = { sendMail };

import { Resend } from "resend";
import { siteConfig } from "@/lib/site-config";

export type AdminEmailPayload = {
  type: string;
  title: string;
  body?: string;
  href?: string;
  details?: Record<string, string>;
};

let resend: Resend | null = null;

function getResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

function adminRecipients(): string[] {
  return (process.env.ADMIN_NOTIFICATION_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absoluteUrl(href?: string) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url).replace(/\/$/, "");
  if (!href) return base;
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  return `${base}${href.startsWith("/") ? href : `/${href}`}`;
}

function renderDetailsTable(details?: Record<string, string>) {
  const rows = Object.entries(details ?? {}).filter(([, v]) => v.trim().length > 0);
  if (rows.length === 0) return "";
  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e6eef6;color:#5a6b80;font-size:13px;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e6eef6;color:#001848;font-size:13px;font-weight:600;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #e6eef6;border-radius:8px;overflow:hidden;">${htmlRows}</table>`;
}

type EmailTemplateOptions = {
  eyebrow?: string;
  heading: string;
  greeting?: string;
  body: string;
  detailHtml?: string;
  contentHtml?: string;
  highlight?: string;
  cta?: { label: string; href: string };
  footer?: string;
};

export function renderEmailTemplate(options: EmailTemplateOptions) {
  const logoUrl = absoluteUrl("/logo2.png");
  const greeting = options.greeting
    ? `<p style="margin:0 0 12px;color:#001848;font-size:15px;">${escapeHtml(options.greeting)}</p>`
    : "";
  const highlight = options.highlight
    ? `<div style="margin:20px 0;padding:14px 16px;background:#f4f8fc;border-left:4px solid #2f8acb;border-radius:8px;color:#001848;font-size:15px;font-weight:700;">${escapeHtml(options.highlight)}</div>`
    : "";
  const cta = options.cta
    ? `<a href="${escapeHtml(options.cta.href)}" style="display:inline-block;margin-top:8px;background:#0050a0;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:999px;font-size:14px;font-weight:700;">${escapeHtml(options.cta.label)}</a>`
    : "";
  const footer =
    options.footer ||
    "If you have questions, reply to this email and the SARA Advisors team will help.";

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#eef4f8;font-family:Inter,Segoe UI,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(options.heading)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef4f8;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #d8e8f8;box-shadow:0 8px 24px rgba(0,24,72,0.08);">
            <tr>
              <td style="background:#001848;padding:24px 30px;border-top:4px solid #2f8acb;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:14px;vertical-align:middle;">
                      <img src="${escapeHtml(logoUrl)}" alt="SARA Advisors" width="52" height="52" style="display:block;width:52px;height:52px;border:0;border-radius:10px;" />
                    </td>
                    <td style="vertical-align:middle;">
                      <div style="color:#8fc7ed;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">SARA Advisors</div>
                      <div style="color:#ffffff;font-size:21px;font-weight:750;line-height:1.3;margin-top:7px;">${escapeHtml(options.eyebrow || "A message from SARA Advisors")}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 30px;">
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#001848;">${escapeHtml(options.heading)}</h1>
                ${greeting}
                <p style="margin:0 0 12px;color:#3d4f66;font-size:15px;line-height:1.7;">${escapeHtml(options.body)}</p>
                ${options.contentHtml || ""}
                ${highlight}
                ${options.detailHtml || ""}
                ${cta}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 30px 26px;color:#7a8aa0;font-size:12px;line-height:1.6;border-top:1px solid #eef3f7;">
                ${escapeHtml(footer)}<br /><br />
                SARA Advisors · Confidential business and investment advisory
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderText(payload: AdminEmailPayload, link: string) {
  const detailLines = Object.entries(payload.details ?? {})
    .filter(([, v]) => v.trim().length > 0)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return [
    payload.title,
    payload.body ?? "",
    detailLines,
    `Open: ${link}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Emails ADMIN_NOTIFICATION_EMAIL via Resend. No-ops if env is incomplete. */
export async function sendAdminNotificationEmail(payload: AdminEmailPayload) {
  const client = getResend();
  const to = adminRecipients();
  const from = process.env.EMAIL_FROM?.trim();
  if (!client || to.length === 0 || !from) return;

  const link = absoluteUrl(payload.href);
  const { error } = await client.emails.send({
    from,
    to,
    subject: `[SARA] ${payload.title}`,
    html: renderEmailTemplate({
      eyebrow: "New desk activity",
      heading: payload.title,
      body: payload.body || "A new item needs attention in the SARA Advisors workspace.",
      detailHtml: renderDetailsTable(payload.details),
      cta: { label: "Open in SARA", href: link },
      footer: "Sent to the configured SARA Advisors admin inbox. Please handle client information confidentially.",
    }),
    text: renderText(payload, link),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendTransactionalEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ skipped: boolean }> {
  const client = getResend();
  const from = process.env.EMAIL_FROM?.trim();
  if (!client || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[mail] skipped transactional email to ${opts.to}: ${opts.subject}`);
      return { skipped: true };
    }
    throw new Error("Email is not configured. Set RESEND_API_KEY and EMAIL_FROM.");
  }

  const { error } = await client.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
  if (error) throw new Error(error.message);
  return { skipped: false };
}

export async function sendProjectBankMagicLinkEmail(opts: {
  to: string;
  name: string;
  projectTitle: string;
  verifyHref: string;
}) {
  const link = absoluteUrl(opts.verifyHref);
  return sendTransactionalEmail({
    to: opts.to,
    subject: `Confirm your email | SARA Advisors`,
    text: `Hello ${opts.name || ""},\n\nConfirm your work email to continue your dossier request for "${opts.projectTitle}". This link expires in 24 hours.\n\n${link}\n\nIf you did not request this, you can ignore this email.`,
    html: renderEmailTemplate({
      eyebrow: "Secure access",
      heading: "Confirm your email",
      greeting: opts.name ? `Hello ${opts.name},` : "Hello,",
      body: `Confirm this work email to continue your request for the full dossier on ${opts.projectTitle}. The link expires in 24 hours.`,
      cta: { label: "Confirm email", href: link },
      footer: "If you did not request this, you can ignore this email.",
    }),
  });
}

export async function sendListingMagicLinkEmail(opts: {
  to: string;
  name: string;
  hashId: string;
  verifyHref: string;
}) {
  const link = absoluteUrl(opts.verifyHref);
  return sendTransactionalEmail({
    to: opts.to,
    subject: `Confirm your email | SARA Advisors`,
    text: `Hello ${opts.name || ""},\n\nConfirm your work email to continue your full-profile request for ${opts.hashId}. This link expires in 24 hours.\n\n${link}\n\nIf you did not request this, you can ignore this email.`,
    html: renderEmailTemplate({
      eyebrow: "Secure access",
      heading: "Confirm your email",
      greeting: opts.name ? `Hello ${opts.name},` : "Hello,",
      body: `Confirm this work email to continue your request for the full profile on ${opts.hashId}. The link expires in 24 hours.`,
      cta: { label: "Confirm email", href: link },
      footer: "If you did not request this, you can ignore this email.",
    }),
  });
}

export async function sendOwnerProjectDecisionEmail(opts: {
  to: string;
  name?: string | null;
  projectTitle: string;
  outcome: "published" | "rejected";
  notes?: string | null;
  href: string;
}) {
  const link = absoluteUrl(opts.href);
  const greeting = opts.name ? `Hello ${opts.name},` : "Hello,";
  const title = opts.projectTitle;
  const notes = opts.notes?.trim();

  const copy =
    opts.outcome === "published"
      ? {
          subject: `"${title}" is live on Project Bank`,
          heading: "Your idea is live",
          body:
            "Investors can now discover your teaser on Project Bank and request the full dossier. SARA will introduce qualified interest after an NDA.",
          cta: "View your listing",
        }
      : {
          subject: `Update on "${title}"`,
          heading: "Not approved this time",
          body:
            notes ||
            "The deal desk did not approve this Project Bank submission. You can review the notes on your dashboard or reply to this email with questions.",
          cta: "Open your dashboard",
        };

  return sendTransactionalEmail({
    to: opts.to,
    subject: copy.subject,
    text: `${greeting}\n\n${copy.body}\n\n${copy.cta}: ${link}\n\nSARA Advisors`,
    html: renderEmailTemplate({
      eyebrow: "Project Bank update",
      heading: copy.heading,
      greeting,
      body: copy.body,
      highlight: title,
      cta: { label: copy.cta, href: link },
      footer: "This message was sent because your Project Bank idea was reviewed. Reply if you have questions for the deal desk.",
    }),
  }).catch((err) => {
    console.error("[mail] failed to email project owner", err);
    return { skipped: true };
  });
}

export async function sendOwnerListingDecisionEmail(opts: {
  to: string;
  name?: string | null;
  hashId: string;
  outcome: "published" | "rejected";
  notes?: string | null;
  href: string;
}) {
  const link = absoluteUrl(opts.href);
  const greeting = opts.name ? `Hello ${opts.name},` : "Hello,";
  const hashId = opts.hashId;
  const notes = opts.notes?.trim();

  const copy =
    opts.outcome === "published"
      ? {
          subject: `${hashId} is live on the marketplace`,
          heading: "Your listing is live",
          body: "Buyers can now discover your anonymized listing. SARA arranges an NDA before anything confidential is shared.",
          cta: "View your listing",
        }
      : {
          subject: `Update on ${hashId}`,
          heading: "Not approved this time",
          body:
            notes ||
            "The deal desk did not approve this listing. You can review the notes on your dashboard or reply to this email with questions.",
          cta: "Open your dashboard",
        };

  return sendTransactionalEmail({
    to: opts.to,
    subject: copy.subject,
    text: `${greeting}\n\n${copy.body}\n\n${copy.cta}: ${link}\n\nSARA Advisors`,
    html: renderEmailTemplate({
      eyebrow: "Marketplace update",
      heading: copy.heading,
      greeting,
      body: copy.body,
      highlight: hashId,
      cta: { label: copy.cta, href: link },
      footer: "This message was sent because your listing was reviewed. Reply if you have questions for the deal desk.",
    }),
  }).catch((err) => {
    console.error("[mail] failed to email listing owner", err);
    return { skipped: true };
  });
}

export async function sendInvestorNoticeEmail(opts: {
  to: string;
  name: string;
  subject: string;
  body: string;
  href: string;
}) {
  const link = absoluteUrl(opts.href);
  const greeting = opts.name ? `Hello ${opts.name},` : "Hello,";
  return sendTransactionalEmail({
    to: opts.to,
    subject: opts.subject,
    text: `${greeting}\n\n${opts.body}\n\nOpen: ${link}`,
    html: renderEmailTemplate({
      eyebrow: "Investor update",
      heading: opts.subject,
      greeting,
      body: opts.body,
      cta: { label: "Continue", href: link },
    }),
  }).catch((err) => {
    console.error("[mail] failed to email investor", err);
    return { skipped: true };
  });
}

export function compactDetails(
  rows: Record<string, string | number | boolean | null | undefined>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(rows)) {
    if (value === null || value === undefined || value === "") continue;
    out[key] = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  }
  return out;
}

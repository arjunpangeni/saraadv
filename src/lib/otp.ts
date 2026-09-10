import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { renderEmailTemplate, sendTransactionalEmail } from "@/lib/mail";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashOtp(email: string, code: string) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required to issue email verification codes.");
  }
  return createHash("sha256").update(`${secret}:${email}:${code}`).digest("hex");
}

function generateCode() {
  return String(randomInt(100000, 1000000));
}

function otpEmailHtml(code: string) {
  return renderEmailTemplate({
    eyebrow: "Account security",
    heading: "Your verification code",
    body: "Enter this code to verify your email. It expires in 10 minutes.",
    contentHtml: `<div style="margin:22px 0;padding:18px;background:#f4f8fc;border:1px solid #d8e8f8;border-radius:12px;color:#001848;font-size:32px;letter-spacing:0.28em;font-weight:700;text-align:center;">${code}</div>`,
    footer: "If you did not create a ASAR Partners account, you can ignore this email.",
  });
}

export async function issueEmailOtp(email: string, purpose = "register") {
  const normalized = email.trim().toLowerCase();
  const latest = await prisma.emailOtp.findFirst({
    where: { email: normalized, purpose },
    orderBy: { createdAt: "desc" },
  });
  if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - latest.createdAt.getTime())) / 1000);
    return { ok: false as const, error: `Wait ${wait}s before requesting a new code.`, retryAfter: wait };
  }

  const code = generateCode();
  await prisma.emailOtp.deleteMany({ where: { email: normalized, purpose } });
  await prisma.emailOtp.create({
    data: {
      email: normalized,
      purpose,
      codeHash: hashOtp(normalized, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  const sent = await sendTransactionalEmail({
    to: normalized,
    subject: "Your ASAR Partners verification code",
    html: otpEmailHtml(code),
    text: `Your ASAR Partners verification code is ${code}. It expires in 10 minutes.`,
  });

  if (sent.skipped) {
    console.info(`[otp] verification email skipped for ${normalized} — configure Resend`);
  }

  return { ok: true as const };
}

export async function verifyEmailOtp(email: string, code: string, purpose = "register") {
  const normalized = email.trim().toLowerCase();
  const digits = code.replace(/\s/g, "");
  const row = await prisma.emailOtp.findFirst({
    where: { email: normalized, purpose },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return { ok: false as const, error: "No verification code found. Request a new one." };
  if (row.expiresAt.getTime() < Date.now()) {
    await prisma.emailOtp.delete({ where: { id: row.id } });
    return { ok: false as const, error: "That code has expired. Request a new one." };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    await prisma.emailOtp.delete({ where: { id: row.id } });
    return { ok: false as const, error: "Too many attempts. Request a new code." };
  }
  if (row.codeHash !== hashOtp(normalized, digits)) {
    await prisma.emailOtp.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    const left = MAX_ATTEMPTS - row.attempts - 1;
    return { ok: false as const, error: left > 0 ? `Incorrect code. ${left} attempts left.` : "Too many attempts. Request a new code." };
  }

  await prisma.emailOtp.delete({ where: { id: row.id } });
  return { ok: true as const };
}

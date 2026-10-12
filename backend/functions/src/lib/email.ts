import { defineSecret } from 'firebase-functions/params';
import { Resend } from 'resend';

// 운영에서는 Secret Manager 에 바인딩되며 런타임에 process.env.RESEND_API_KEY 로 노출된다.
export const RESEND_API_KEY = defineSecret('RESEND_API_KEY');

export const FROM_ADDRESS = 'UNIK Seoul Marathon Tour <noreply@unik.ph>';

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendEmail(opts: {
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<'sent' | 'skipped'> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`RESEND_API_KEY not configured. Skipping email: ${opts.subject}`);
    return 'skipped';
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    reply_to: opts.replyTo,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  return 'sent';
}

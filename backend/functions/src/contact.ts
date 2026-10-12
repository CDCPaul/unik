import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { COL } from './lib/collections';
import { escapeHtml, RESEND_API_KEY, sendEmail } from './lib/email';
import { getNotifyEmails } from './lib/tourConfig';

interface ContactData {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

export function contactEmailHtml(data: ContactData, docId: string): string {
  const row = (label: string, value: unknown) =>
    `<tr><td style="padding:6px 12px;color:#5A6680;font-size:12px;text-transform:uppercase">${label}</td>` +
    `<td style="padding:6px 12px;font-size:15px">${escapeHtml(value)}</td></tr>`;
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1F2430">
<h2 style="color:#0B1F4D">New inquiry from the website</h2>
<table style="border-collapse:collapse">
${row('Name', data.name)}${row('Email', data.email)}${data.phone ? row('Phone', data.phone) : ''}${row('Subject', data.subject)}
</table>
<div style="margin-top:16px;padding:16px;background:#F4F6FA;border-radius:8px;white-space:pre-wrap">${escapeHtml(data.message)}</div>
<p style="color:#5A6680;font-size:12px">Inquiry ID: ${escapeHtml(docId)}. Reply to this email to answer the customer.</p>
</body></html>`;
}

export const onNewContact = onDocumentCreated({ document: `${COL.contacts}/{docId}`, secrets: [RESEND_API_KEY] }, async (event) => {
  const snap = event.data;
  if (!snap) return;
  const data = snap.data() as ContactData;
  try {
    const result = await sendEmail({
      to: await getNotifyEmails(getFirestore()),
      subject: `[UNIK] New inquiry: ${data.subject || 'General inquiry'}`,
      html: contactEmailHtml(data, snap.id),
      replyTo: data.email,
    });
    await snap.ref.update({ emailNotificationSent: result === 'sent', emailNotificationSentAt: FieldValue.serverTimestamp() });
  } catch (error) {
    console.error('onNewContact email failed', error);
    await snap.ref.update({ emailNotificationSent: false, emailNotificationError: String(error) });
  }
});

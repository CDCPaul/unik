import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { normalizeCounts } from '../shared-domain';
import { COL } from '../lib/collections';
import { RESEND_API_KEY, sendEmail } from '../lib/email';
import { getNotifyEmails } from '../lib/tourConfig';
import { recomputeAvailability } from './availability';
import { customerEmail, staffEmail, type ApplicationEmailData } from './emails';

export const onApplicationWritten = onDocumentWritten(`${COL.applications}/{docId}`, async () => {
  await recomputeAvailability(getFirestore());
});

export const onTourConfigWritten = onDocumentWritten(`${COL.tourConfig}/{docId}`, async () => {
  await recomputeAvailability(getFirestore());
});

export const onApplicationCreated = onDocumentCreated({ document: `${COL.applications}/{docId}`, secrets: [RESEND_API_KEY] }, async (event) => {
  const snap = event.data;
  if (!snap) return;
  const data = snap.data() as ApplicationEmailData;
  const app: ApplicationEmailData = { ...data, counts: normalizeCounts(data.counts) };
  const notifyEmails = await getNotifyEmails(getFirestore());
  const notifications: Record<string, unknown> = {};

  try {
    const mail = customerEmail(app);
    notifications.customerEmail = await sendEmail({
      to: [app.lead.email],
      subject: mail.subject,
      html: mail.html,
      replyTo: notifyEmails[0],
    });
  } catch (error) {
    console.error('customer email failed', error);
    notifications.customerEmailError = String(error);
  }

  try {
    const mail = staffEmail(app, snap.id);
    notifications.staffEmail = await sendEmail({
      to: notifyEmails,
      subject: mail.subject,
      html: mail.html,
      replyTo: app.lead.email,
    });
  } catch (error) {
    console.error('staff email failed', error);
    notifications.staffEmailError = String(error);
  }

  await snap.ref.update({ notifications: { ...notifications, at: FieldValue.serverTimestamp() } });
});

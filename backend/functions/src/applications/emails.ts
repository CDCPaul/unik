import { describeCounts, formatPHP, totalPax, type Counts, type Pricing } from '../shared-domain';
import { escapeHtml } from '../lib/email';

export interface ApplicationEmailData {
  appNo: string;
  status: string;
  lead: {
    firstName: string;
    lastName: string;
    email: string;
    phoneDial: string;
    phoneNumber: string;
    viber: boolean;
    whatsapp: boolean;
  };
  departure: { id: string; label: string; departDate: string; returnDate: string };
  counts: Counts;
  pricing: Pricing;
  specialRequests?: string | null;
}

const TOUR_NAME = 'Seoul Marathon 2027 Tour';

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#F4F6FA;font-family:Arial,sans-serif;color:#1F2430">
<div style="max-width:600px;margin:0 auto;padding:24px">
<div style="background:#0B1F4D;color:#FFFFFF;padding:24px;border-radius:12px 12px 0 0">
<div style="font-size:12px;letter-spacing:2px;color:#F6C343">UNIK · SEOUL MARATHON 2027</div>
<h1 style="margin:8px 0 0;font-size:22px">${title}</h1>
</div>
<div style="background:#FFFFFF;padding:24px;border-radius:0 0 12px 12px;line-height:1.6">${body}</div>
<p style="font-size:12px;color:#5A6680;text-align:center">CDC Travel (Cebu Direct Club) · unik.ph</p>
</div></body></html>`;
}

function summaryTable(app: ApplicationEmailData): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;color:#5A6680;width:160px">${label}</td><td style="padding:6px 0;font-weight:bold">${value}</td></tr>`;
  const promo = app.pricing.promo
    ? row(
        'Promo',
        app.pricing.promo.discountTotal > 0
          ? `${escapeHtml(app.pricing.promo.code)} (−${formatPHP(app.pricing.promo.discountTotal)})`
          : `${escapeHtml(app.pricing.promo.code)} (${escapeHtml(app.pricing.promo.agencyName)})`,
      )
    : '';
  return `<table style="width:100%;border-collapse:collapse">
${row('Application no.', escapeHtml(app.appNo))}
${row('Departure', `${escapeHtml(app.departure.label)}, ${escapeHtml(app.departure.departDate)} to ${escapeHtml(app.departure.returnDate)}`)}
${row('Travelers', escapeHtml(describeCounts(app.counts)))}
${promo}
${row('Estimated total', formatPHP(app.pricing.total))}
</table>`;
}

export function customerEmail(app: ApplicationEmailData): { subject: string; html: string } {
  const name = escapeHtml(app.lead.firstName);
  if (app.status === 'waitlist') {
    return {
      subject: `You're on the waitlist (${app.appNo}) | ${TOUR_NAME}`,
      html: layout(
        'You are on the waitlist',
        `<p>Hi ${name},</p>
<p>Thank you for applying. All available slots are currently taken, so we have added you to the waitlist. We will contact you as soon as a slot opens.</p>
${summaryTable(app)}
<p>No payment is needed. Reply to this email if you have any questions.</p>`,
      ),
    };
  }
  return {
    subject: `We received your application ${app.appNo} | ${TOUR_NAME}`,
    html: layout(
      'We received your application',
      `<p>Hi ${name},</p>
<p>Thank you for applying for the ${TOUR_NAME} with Artjoy Torregosa. Here is a summary:</p>
${summaryTable(app)}
<p><strong>No payment is needed yet.</strong> Our team will contact you within 1 to 2 business days to confirm your slot, collect any missing traveler details, and send payment instructions for the deposit (${formatPHP(app.pricing.depositDue)}).</p>
<p>Reply to this email if you have any questions.</p>`,
    ),
  };
}

export function staffEmail(app: ApplicationEmailData, docId: string): { subject: string; html: string } {
  const pax = totalPax(app.counts);
  const waitlist = app.status === 'waitlist' ? ' (WAITLIST)' : '';
  const promo = app.pricing.promo ? ` | ${app.pricing.promo.code}` : '';
  const contact = [
    `${escapeHtml(app.lead.firstName)} ${escapeHtml(app.lead.lastName)}`,
    escapeHtml(app.lead.email),
    `${escapeHtml(app.lead.phoneDial)} ${escapeHtml(app.lead.phoneNumber)}${app.lead.viber ? ' · Viber' : ''}${app.lead.whatsapp ? ' · WhatsApp' : ''}`,
  ].join('<br>');
  return {
    subject: `[UNIK] ${app.appNo}${waitlist} ${app.lead.firstName} ${app.lead.lastName} | ${pax} pax${promo}`,
    html: layout(
      `New application ${escapeHtml(app.appNo)}${waitlist}`,
      `<p>${contact}</p>
${summaryTable(app)}
${app.specialRequests ? `<p style="background:#F4F6FA;padding:12px;border-radius:8px;white-space:pre-wrap">${escapeHtml(app.specialRequests)}</p>` : ''}
<p><a href="https://unik.ph/admin/applicants?id=${encodeURIComponent(docId)}" style="display:inline-block;background:#0B1F4D;color:#FFFFFF;padding:12px 20px;border-radius:8px;text-decoration:none">Open in admin</a></p>`,
    ),
  };
}

import { SITE } from './site';

type LegalDoc = { title: string; updated: string; sections: { heading: string; body: string[] }[] };

const UPDATED = 'October 2026';

export const LEGAL: Record<'terms' | 'privacy' | 'refund', LegalDoc> = {
  terms: {
    title: 'Terms and Conditions',
    updated: UPDATED,
    sections: [
      { heading: 'Who we are', body: [`This website is operated by ${SITE.operator}, ${SITE.address}.`] },
      {
        heading: 'Applications',
        body: [
          'Submitting an application does not guarantee a place on the tour. Your place is confirmed only after our team contacts you and we receive your deposit.',
          'Race entries are limited and allocated first come, first served. If the tour is full, your application is placed on a waitlist.',
        ],
      },
      {
        heading: 'Prices and payment',
        body: [
          'Prices are in Philippine pesos (PHP) per person on twin-share accommodation unless stated otherwise. Promo code discounts apply per person to the package price only.',
          'Deposit and balance due dates are sent to you when your slot is confirmed. [TBC: payment schedule]',
        ],
      },
      {
        heading: 'Travel documents',
        body: ['You are responsible for a valid passport and any visa required to enter Korea. We will guide you through the requirements.'],
      },
      {
        heading: 'Changes',
        body: ['Race details are set by the race organizers and may change. Flight times and the itinerary may change for operational reasons. We will inform you of significant changes.'],
      },
      { heading: 'Contact', body: [`${SITE.email} · ${SITE.phone}`] },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: UPDATED,
    sections: [
      {
        heading: 'What we collect',
        body: [
          'Contact details (name, email, mobile number), traveler details you choose to provide (name as in passport, date of birth, gender, nationality, T-shirt size, expected finish time, room preference, emergency contact) and any requests you send us.',
        ],
      },
      {
        heading: 'Why we use it',
        body: [
          'To process your application, register runners with the race organizers, book flights and hotels, contact you about your booking, and meet legal requirements.',
          'If you applied through a travel agency promo code, we record which agency referred you.',
        ],
      },
      {
        heading: 'Who we share it with',
        body: ['Only with the race organizers, airlines, hotels and partners needed to deliver the tour. We do not sell your data.'],
      },
      {
        heading: 'How long we keep it',
        body: ['We keep traveler details until the tour is completed and settled, then delete or anonymize them after [TBC: retention period].'],
      },
      {
        heading: 'Your rights',
        body: [`Under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) you may access, correct or ask us to delete your data. Contact ${SITE.email}.`],
      },
    ],
  },
  refund: {
    title: 'Refund and Cancellation Policy',
    updated: UPDATED,
    sections: [
      { heading: 'Before confirmation', body: ['Applying is free. You can withdraw your application at any time before paying the deposit.'] },
      {
        heading: 'After payment',
        body: ['[TBC: cancellation charges by date, including the non-refundable race entry and airfare portions]'],
      },
      {
        heading: 'If the race is cancelled',
        body: ['[TBC: policy if the race is cancelled]'],
      },
      { heading: 'How to cancel', body: [`Email ${SITE.email} with your application number.`] },
    ],
  },
};

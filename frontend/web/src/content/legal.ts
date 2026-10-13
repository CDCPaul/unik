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
          'Deposit and balance due dates are sent to you when your slot is confirmed. The full balance is due before flights are ticketed.',
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
        heading: 'On your device and form protection',
        body: [
          'While you fill in the application form, your answers are saved on your own device (in your browser) so you can come back to them. They stay there until you submit the form, for up to 14 days after your last change, and are then removed.',
          'We use Google reCAPTCHA (through Firebase App Check) to protect our forms from spam and abuse. It runs in the background and may process technical information such as your IP address and browser details, under the Google Privacy Policy and Terms of Service.',
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
        body: ['We keep traveler details until the tour is completed and settled, then delete or anonymize them within one year after the tour ends.'],
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
        body: ['Cancellation charges depend on how close to departure you cancel. Race entry fees and airfare that have already been paid to the organizers or airlines may not be refundable. The exact charges are stated in your booking confirmation.'],
      },
      {
        heading: 'If the race is cancelled',
        body: ['If the organizers cancel the race, we will contact you with the options available, such as continuing the trip or cancelling. Any amount refunded to us by the organizers, airlines or hotels will be passed on to you.'],
      },
      { heading: 'How to cancel', body: [`Email ${SITE.email} with your application number.`] },
    ],
  },
};

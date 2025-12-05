'use client';

import { motion } from 'framer-motion';
import { 
  FileText, Plane, Thermometer, CreditCard, Phone, 
  AlertCircle, ChevronDown, MapPin, Clock, Languages
} from 'lucide-react';
import { useState } from 'react';

const infoSections = [
  {
    id: 'visa',
    icon: FileText,
    title: 'Visa Requirements',
    content: `
      <p class="mb-4">Philippine passport holders can enter South Korea visa-free for up to 30 days for tourism purposes, provided they have:</p>
      <ul class="list-disc list-inside space-y-2 text-dark-300">
        <li>A valid passport with at least 6 months validity</li>
        <li>Return/onward flight tickets</li>
        <li>Proof of accommodation (hotel booking)</li>
        <li>Sufficient funds for the trip</li>
        <li>No previous immigration violations</li>
      </ul>
      <p class="mt-4 text-gold-400">Note: Visa requirements may change. Please verify with the Korean Embassy before traveling.</p>
    `,
  },
  {
    id: 'weather',
    icon: Thermometer,
    title: 'Weather & Packing',
    content: `
      <p class="mb-4">January in Seoul is cold with temperatures ranging from -6°C to 1°C (21°F to 34°F). Pack accordingly:</p>
      <ul class="list-disc list-inside space-y-2 text-dark-300">
        <li>Heavy winter coat or padded jacket</li>
        <li>Thermal underwear and layers</li>
        <li>Warm boots with good grip (for ice/snow)</li>
        <li>Gloves, scarf, and winter hat</li>
        <li>Hand warmers (available in convenience stores)</li>
        <li>Comfortable shoes for walking tours</li>
      </ul>
    `,
  },
  {
    id: 'money',
    icon: CreditCard,
    title: 'Money & Payments',
    content: `
      <p class="mb-4">The currency in South Korea is the Korean Won (KRW). Tips for handling money:</p>
      <ul class="list-disc list-inside space-y-2 text-dark-300">
        <li>Exchange PHP to KRW before departure or at the airport</li>
        <li>Credit cards are widely accepted in Seoul</li>
        <li>Many places accept international cards (Visa, Mastercard)</li>
        <li>Carry some cash for small purchases and street food</li>
        <li>T-money card recommended for public transportation</li>
      </ul>
      <p class="mt-4 text-dark-400">Exchange Rate (approx): 1 PHP = 23-25 KRW</p>
    `,
  },
  {
    id: 'communication',
    icon: Phone,
    title: 'Communication',
    content: `
      <p class="mb-4">Stay connected during your trip:</p>
      <ul class="list-disc list-inside space-y-2 text-dark-300">
        <li>Rent a pocket WiFi or buy a Korean SIM card at the airport</li>
        <li>Free WiFi available in most hotels, cafes, and public areas</li>
        <li>KakaoTalk is the main messaging app in Korea</li>
        <li>Google Maps works well for navigation</li>
        <li>Papago or Google Translate for language assistance</li>
      </ul>
    `,
  },
];

const faqs = [
  {
    question: 'What happens if my visa is denied?',
    answer: 'If you have a visa-free entry to Korea as a Philippine passport holder, this generally should not be an issue. However, if for any reason you are denied entry, please contact us immediately and we will assist with the refund process according to our policy.',
  },
  {
    question: 'Is travel insurance included?',
    answer: 'Travel insurance is NOT included in the package but is highly recommended. We suggest purchasing comprehensive travel insurance that covers medical emergencies, trip cancellation, and lost luggage.',
  },
  {
    question: 'Can I extend my stay after the tour?',
    answer: 'Yes! You can extend your stay in Korea. Just let us know in advance so we can arrange a one-way transfer to the airport on your preferred departure date instead.',
  },
  {
    question: 'What is the payment schedule?',
    answer: 'A 50% deposit is required to secure your booking. The remaining balance is due 30 days before the departure date. We accept bank transfers and major credit cards.',
  },
  {
    question: 'Are the game seats guaranteed?',
    answer: 'Yes, your KBL All-Star Game tickets are guaranteed and included in the package. Exact seat locations will be provided closer to the event date.',
  },
  {
    question: 'What if I have dietary restrictions?',
    answer: 'Please inform us of any dietary restrictions or allergies during registration. We will do our best to accommodate your needs during included meals.',
  },
];

export default function InfoPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-hero-pattern relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark-900" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        
        <div className="container-custom relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-gold-500 font-medium uppercase tracking-wider">
              Essential Information
            </span>
            <h1 className="section-heading mt-4 mb-6">
              Travel Information
            </h1>
            <p className="text-dark-400 text-lg">
              Everything you need to know before your trip to Korea.
              Prepare well for an amazing experience.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Facts */}
      <section className="py-8 bg-dark-950 border-y border-dark-800">
        <div className="container-custom">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <div className="flex items-center gap-2 text-dark-300">
              <Clock className="w-5 h-5 text-gold-500" />
              <span>GMT+9 (1 hour ahead of PH)</span>
            </div>
            <div className="flex items-center gap-2 text-dark-300">
              <MapPin className="w-5 h-5 text-gold-500" />
              <span>~4 hour flight from Manila</span>
            </div>
            <div className="flex items-center gap-2 text-dark-300">
              <Languages className="w-5 h-5 text-gold-500" />
              <span>Korean (English in tourist areas)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Info Sections */}
      <section className="py-24 bg-dark-900">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-8">
            {infoSections.map((section, index) => (
              <motion.div
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card p-8"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center">
                    <section.icon className="w-6 h-6 text-gold-400" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
                </div>
                <div 
                  className="text-dark-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-dark-950">
        <div className="container-custom">
          <div className="text-center mb-16">
            <span className="text-gold-500 font-medium uppercase tracking-wider">
              Got Questions?
            </span>
            <h2 className="section-heading mt-4">Frequently Asked Questions</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="card overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-6 flex items-center justify-between text-left"
                >
                  <span className="text-white font-medium pr-4">{faq.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 text-gold-500 flex-shrink-0 transition-transform duration-300 
                              ${openFaq === index ? 'rotate-180' : ''}`} 
                  />
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 
                             ${openFaq === index ? 'max-h-96' : 'max-h-0'}`}
                >
                  <div className="px-6 pb-6 text-dark-400 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-16 bg-dark-900 border-t border-dark-800">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="card-premium p-8 flex gap-6">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Important Notice</h3>
                <p className="text-dark-400 leading-relaxed">
                  All information provided is accurate as of the time of publication. 
                  Travel requirements and conditions may change without notice. 
                  We recommend checking with relevant authorities and keeping up to date 
                  with travel advisories before your departure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}


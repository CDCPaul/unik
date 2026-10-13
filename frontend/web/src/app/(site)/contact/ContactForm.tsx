'use client';

import { useState } from 'react';
import { EMAIL_PATTERN, hasControlCharsExceptWhitespace, isValidName } from '@unik/shared/domain';
import { SITE } from '@/content/site';
import { createContactMessage } from '@/lib/services/contacts';

const input = 'min-h-12 w-full rounded-xl border-2 border-brand-line px-3.5 font-medium text-brand-ink';

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('idle');
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const message = form.message.trim();
    if (!isValidName(name)) return setError('Please enter your name.');
    if (!EMAIL_PATTERN.test(email) || email.length > 120) return setError('Please enter a valid email address.');
    if (phone.length > 40) return setError('Please shorten the phone number.');
    if (!message || message.length > 5000 || hasControlCharsExceptWhitespace(message)) return setError('Please enter your message.');
    setError('');
    setStatus('sending');
    try {
      await createContactMessage({
        name,
        email,
        subject: form.subject.trim().slice(0, 200) || 'General inquiry',
        message,
        ...(phone ? { phone } : {}),
      });
      setStatus('sent');
    } catch (err) {
      console.error('contact submit failed', err);
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return <p className="rounded-2xl bg-brand-soft p-6 font-semibold text-brand-ink">Thank you! We received your message and will reply by email.</p>;
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">Name *<input className={input} value={form.name} onChange={set('name')} autoComplete="name" /></label>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">Email *<input className={input} type="email" value={form.email} onChange={set('email')} autoComplete="email" /></label>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">Mobile (optional)<input className={input} type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" /></label>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">Subject<input className={input} value={form.subject} onChange={set('subject')} /></label>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">Message *<textarea className={`${input} py-3`} rows={5} value={form.message} onChange={set('message')} /></label>
      {error ? <p role="alert" className="font-semibold text-brand-red">{error}</p> : null}
      {status === 'error' ? <p role="alert" className="font-semibold text-brand-red">Sending failed. Please email us at {SITE.email}.</p> : null}
      <button type="submit" disabled={status === 'sending'} className="min-h-14 rounded-full bg-brand-red font-extrabold text-white disabled:opacity-60">
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}

'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { useTheme } from '@/context/ThemeContext';

const footerLinks = {
  navigation: [
    { href: '/', label: 'Home' },
    { href: '/players', label: 'Players' },
    { href: '/tour', label: 'Tour Package' },
    { href: '/info', label: 'Travel Info' },
  ],
  support: [
    { href: '/register', label: 'Register Now' },
    { href: '/contact', label: 'Contact Us' },
    { href: '/info#faq', label: 'FAQ' },
    { href: '/info#visa', label: 'Visa Info' },
  ],
};

export default function Footer() {
  const { settings } = useSettings();
  const { theme } = useTheme();

  return (
    <footer style={{ backgroundColor: theme.footerBg, borderTopColor: theme.cardBg }} className="border-t">
      {/* Main Footer */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-3xl font-display font-bold">
                <span style={{ color: theme.headingText }}>UNI</span>
                <span style={{ color: theme.goldColor }}>K</span>
              </span>
            </Link>
            <p className="mb-6 leading-relaxed" style={{ color: theme.mutedText }}>
              {settings.description || 'Your gateway to the ultimate KBL All-Star experience.'}
            </p>
            <div className="flex items-center gap-4">
              {settings.socialMedia.facebook && (
                <a
                  href={settings.socialMedia.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg transition-all"
                  style={{ 
                    backgroundColor: theme.cardBg, 
                    color: theme.mutedText 
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = theme.headingText;
                    e.currentTarget.style.backgroundColor = theme.secondaryBtnBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme.mutedText;
                    e.currentTarget.style.backgroundColor = theme.cardBg;
                  }}
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings.socialMedia.instagram && (
                <a
                  href={settings.socialMedia.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg transition-all"
                  style={{ 
                    backgroundColor: theme.cardBg, 
                    color: theme.mutedText 
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = theme.headingText;
                    e.currentTarget.style.backgroundColor = theme.secondaryBtnBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme.mutedText;
                    e.currentTarget.style.backgroundColor = theme.cardBg;
                  }}
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings.socialMedia.twitter && (
                <a
                  href={settings.socialMedia.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg transition-all"
                  style={{ 
                    backgroundColor: theme.cardBg, 
                    color: theme.mutedText 
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = theme.headingText;
                    e.currentTarget.style.backgroundColor = theme.secondaryBtnBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme.mutedText;
                    e.currentTarget.style.backgroundColor = theme.cardBg;
                  }}
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold mb-4 uppercase tracking-wider text-sm" style={{ color: theme.headingText }}>
              Navigation
            </h3>
            <ul className="space-y-3">
              {footerLinks.navigation.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors"
                    style={{ color: theme.mutedText }}
                    onMouseEnter={(e) => e.currentTarget.style.color = theme.headingText}
                    onMouseLeave={(e) => e.currentTarget.style.color = theme.mutedText}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4 uppercase tracking-wider text-sm" style={{ color: theme.headingText }}>
              Support
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors"
                    style={{ color: theme.mutedText }}
                    onMouseEnter={(e) => e.currentTarget.style.color = theme.headingText}
                    onMouseLeave={(e) => e.currentTarget.style.color = theme.mutedText}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 uppercase tracking-wider text-sm" style={{ color: theme.headingText }}>
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 shrink-0 mt-0.5" style={{ color: theme.goldColor }} />
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="transition-colors break-all"
                  style={{ color: theme.mutedText }}
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.headingText}
                  onMouseLeave={(e) => e.currentTarget.style.color = theme.mutedText}
                >
                  {settings.contactEmail}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 shrink-0 mt-0.5" style={{ color: theme.goldColor }} />
                <a
                  href={`tel:${settings.contactPhone}`}
                  className="transition-colors"
                  style={{ color: theme.mutedText }}
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.headingText}
                  onMouseLeave={(e) => e.currentTarget.style.color = theme.mutedText}
                >
                  {settings.contactPhone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 shrink-0 mt-0.5" style={{ color: theme.goldColor }} />
                <span style={{ color: theme.mutedText }}>
                  {settings.officeAddress}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t" style={{ borderTopColor: theme.cardBg }}>
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm" style={{ color: theme.mutedText }}>
              © {new Date().getFullYear()} {settings.brandName}. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link 
                href="/privacy" 
                className="transition-colors"
                style={{ color: theme.mutedText }}
                onMouseEnter={(e) => e.currentTarget.style.color = theme.headingText}
                onMouseLeave={(e) => e.currentTarget.style.color = theme.mutedText}
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms" 
                className="transition-colors"
                style={{ color: theme.mutedText }}
                onMouseEnter={(e) => e.currentTarget.style.color = theme.headingText}
                onMouseLeave={(e) => e.currentTarget.style.color = theme.mutedText}
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';

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
  return (
    <footer className="bg-dark-950 border-t border-dark-800">
      {/* Main Footer */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-3xl font-display font-bold">
                <span className="text-white">UNI</span>
                <span className="gradient-text">K</span>
              </span>
            </Link>
            <p className="text-dark-400 mb-6 leading-relaxed">
              Your gateway to the ultimate KBL All-Star experience. 
              From Philippines to Korea, we make your basketball dreams come true.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="p-2 bg-dark-800 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-all"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-dark-800 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-dark-800 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-all"
                aria-label="Youtube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">
              Navigation
            </h3>
            <ul className="space-y-3">
              {footerLinks.navigation.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-dark-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">
              Support
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-dark-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
                <a
                  href="mailto:ticket@cebudirectclub.com"
                  className="text-dark-400 hover:text-white transition-colors"
                >
                  ticket@cebudirectclub.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
                <a
                  href="tel:+639123456789"
                  className="text-dark-400 hover:text-white transition-colors"
                >
                  +63 912 345 6789
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
                <span className="text-dark-400">
                  Cebu City, Philippines
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-dark-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-dark-500 text-sm">
              © {new Date().getFullYear()} UNIK by Cebu Direct Club. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="text-dark-500 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-dark-500 hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


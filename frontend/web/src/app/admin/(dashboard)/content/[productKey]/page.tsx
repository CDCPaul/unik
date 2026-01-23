'use client';

import { motion } from 'framer-motion';
import { Image, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type ProductKey = 'courtside' | 'cherry-blossom';

function normalizeProductKey(key: string): ProductKey | null {
  if (key === 'courtside') return 'courtside';
  if (key === 'cherry-blossom') return 'cherry-blossom';
  return null;
}

export default function ProductContentPage() {
  const params = useParams();
  const productKey = normalizeProductKey(String(params.productKey || ''));

  if (!productKey) {
    return (
      <div className="admin-card p-6">
        <div className="text-slate-900 font-semibold mb-1">Unknown product</div>
        <div className="text-slate-500 text-sm">Go back to Content and choose a valid product.</div>
      </div>
    );
  }

  const title = productKey === 'courtside' ? 'Courtside (KBL)' : 'Cherry Blossom Marathon';
  const description =
    productKey === 'courtside'
      ? 'Manage Courtside tour package, players, and gallery'
      : 'Manage Cherry Blossom tour package, itinerary/schedule, and gallery';

  const sections = [
    ...(productKey === 'courtside'
      ? [
          {
            title: 'Players',
            description: 'Manage player profiles',
            icon: Users,
            href: `/admin/content/${productKey}/players`,
            color: 'bg-blue-600',
          },
        ]
      : []),
    {
      title: 'Tour Package',
      description: 'Edit tour details, itinerary, schedule, and pricing',
      icon: MapPin,
      href: `/admin/content/${productKey}/tours`,
      color: productKey === 'courtside' ? 'bg-green-600' : 'bg-pink-600',
    },
    {
      title: 'Gallery',
      description: 'Upload and manage photos for this product',
      icon: Image,
      href: `/admin/content/${productKey}/gallery`,
      color: 'bg-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-slate-500">Content / {title}</div>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">{title}</h1>
        <p className="text-slate-500 mt-1">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <Link href={section.href}>
              <div className="admin-card p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${section.color}`}>
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{section.title}</h3>
                <p className="text-sm text-slate-500">{section.description}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}















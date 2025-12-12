'use client';

import Link from 'next/link';
import { LayoutTemplate, Image as ImageIcon, SlidersHorizontal } from 'lucide-react';

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Home</h1>
        <p className="text-slate-500 mt-1">Build the customer home page per product (auto switches by featured tour).</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link
          href="/admin/home/builder"
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-2">
            <LayoutTemplate className="w-5 h-5 text-slate-900" />
            <h2 className="text-lg font-semibold text-slate-900">Builder</h2>
          </div>
          <p className="text-slate-500 text-sm">Enable/disable sections, change order, and edit section text with preview.</p>
        </Link>

        <Link
          href="/admin/home/media"
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-2">
            <ImageIcon className="w-5 h-5 text-slate-900" />
            <h2 className="text-lg font-semibold text-slate-900">Media</h2>
          </div>
          <p className="text-slate-500 text-sm">Upload hero background images (desktop/mobile) per product.</p>
        </Link>
      </div>
    </div>
  );
}



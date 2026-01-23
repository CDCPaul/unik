'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plane, ArrowRight } from 'lucide-react';

const AIRLINES = [
  {
    code: 'JEJU',
    name: 'JEJU Air',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    logo: '/jeju-air-logo.png',
    available: true
  },
  {
    code: 'JIN',
    name: 'JIN Air',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    logo: '/jin-air-logo.png',
    available: true
  },
  {
    code: 'AIRBUSAN',
    name: 'Air Busan',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    logo: '/airbusan-logo.png',
    available: true
  },
  {
    code: '5J',
    name: 'Cebu Pacific',
    color: 'bg-green-100 text-green-800 border-green-200',
    logo: '/cebu-pacific-logo.png',
    available: true
  }
];

export default function SelectAirlinePage() {
  const router = useRouter();

  const handleSelectAirline = (airlineCode: string) => {
    const pathMap: Record<string, string> = {
      'JEJU': 'jeju',
      'JIN': 'jin',
      '5J': 'cebu',
      'AIRBUSAN': 'airbusan'
    };
    const path = pathMap[airlineCode] || airlineCode.toLowerCase();
    router.push(`/admin/tickets/new/${path}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin/tickets" className="text-slate-500 hover:text-slate-700">
            ← Back to List
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Create New Ticket</h1>
        <p className="text-slate-500 mt-1">Select an airline</p>
      </div>

      {/* Airline Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AIRLINES.map((airline, index) => (
          <motion.div
            key={airline.code}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <button
              onClick={() => handleSelectAirline(airline.code)}
              disabled={!airline.available}
              className={`
                w-full p-6 rounded-xl border-2 transition-all
                ${airline.available 
                  ? `${airline.color} hover:shadow-lg hover:scale-105 cursor-pointer` 
                  : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg">
                    <Plane className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold">{airline.name}</h3>
                    <p className="text-sm opacity-80">
                      {airline.available ? (airline.code === 'JIN' ? 'Upload HTML' : 'Upload e-Ticket PDF') : 'Coming Soon'}
                    </p>
                  </div>
                </div>
                {airline.available && (
                  <ArrowRight className="w-6 h-6" />
                )}
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Info Box */}
      <div className="admin-card p-6 bg-blue-50 border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">📌 Information</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Upload the e-Ticket file issued by the airline.</li>
          <li>• For JIN Air, upload the HTML file. For other airlines, upload PDF files.</li>
          <li>• For group tickets, you can also upload the Name List file.</li>
          <li>• Maximum file size: 10MB.</li>
        </ul>
      </div>
    </div>
  );
}

import React from 'react';
import { Printer } from 'lucide-react';

export const PrintButton = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            /* Hide unnecessary browser headers/footers if possible (browser dependent) */
            
            /* Ensure the ticket container takes full width but respects standard margins */
            #ticket-container {
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
              border-radius: 0 !important;
            }

            /* Hide inputs borders for cleaner look, but they are already transparent */
            /* Ensure text wrapping works */
            * {
              overflow: visible !important;
            }
          }
        `}
      </style>
      <button
        onClick={handlePrint}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 print:hidden font-semibold"
        aria-label="Print Itinerary"
      >
        <Printer className="w-5 h-5" />
        <span>Print Itinerary</span>
      </button>
    </>
  );
};

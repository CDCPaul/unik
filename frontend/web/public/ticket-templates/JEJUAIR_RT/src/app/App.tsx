import React from 'react';
import { TicketHeader } from './components/ticket/TicketHeader';
import { NoticeSection } from './components/ticket/NoticeSection';
import { PassengerSection } from './components/ticket/PassengerSection';
import { FlightSection } from './components/ticket/FlightSection';
import { FareSection } from './components/ticket/FareSection';
import { FooterSection } from './components/ticket/FooterSection';
import { PrintButton } from './components/ticket/PrintButton';

const App = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans text-slate-900 print:bg-white print:p-0">
      <div 
        id="ticket-container"
        className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden p-6 md:p-10 lg:p-12 print:shadow-none print:p-0 print:max-w-none print:rounded-none print:overflow-visible"
      >
        <TicketHeader />
        
        <main className="mt-8 space-y-8">
          <NoticeSection />
          <PassengerSection />
          <FlightSection />
          <FareSection />
        </main>

        <FooterSection />
      </div>
      <PrintButton />
    </div>
  );
};

export default App;

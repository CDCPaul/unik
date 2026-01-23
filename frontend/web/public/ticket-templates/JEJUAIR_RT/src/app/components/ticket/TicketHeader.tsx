import React from 'react';
import jejuLogo from 'figma:asset/357c66164e62cff3f167515732347d10c9b5bd0e.png';

export const TicketHeader = () => {
  return (
    <header className="flex flex-col md:flex-row justify-center md:justify-start items-center py-6 mb-2 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <img src={jejuLogo as any} alt="JEJUair" className="h-12 w-auto object-contain" />
      </div>
    </header>
  );
};

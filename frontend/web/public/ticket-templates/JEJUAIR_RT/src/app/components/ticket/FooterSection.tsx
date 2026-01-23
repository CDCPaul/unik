import React from 'react';
import { Mail, Phone } from 'lucide-react';
import { EditableInput } from './EditableInput';

export const FooterSection = () => {
  return (
    <footer className="mt-8 bg-slate-100 rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-sm text-slate-600">
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
        <div className="flex items-center gap-2 hover:text-orange-600 transition-colors cursor-pointer">
          <Mail className="w-4 h-4 flex-shrink-0" />
          <EditableInput initialValue="air@cebu-jejuair.net" className="w-auto" />
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 flex-shrink-0" />
          <EditableInput initialValue="+63-917-673-7107" className="w-auto" />
        </div>
      </div>
      
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide border-t border-slate-200 pt-4 w-full text-center max-w-md">
        <EditableInput initialValue="Cebu Direct Club Phil, Travel & Tours" className="text-center w-full" />
      </div>
    </footer>
  );
};

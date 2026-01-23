import React from 'react';
import { User, FileText } from 'lucide-react';
import { EditableInput } from './EditableInput';

export const PassengerSection = () => {
  return (
    <div className="mb-8 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
        <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4" />
          Itinerary & Passenger Information
        </h2>
      </div>
      <div className="bg-[#FF5F00] px-6 py-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-medium text-orange-100 uppercase opacity-80">Passenger Name</label>
            <div className="text-xl md:text-2xl font-bold tracking-tight">
              <EditableInput 
                initialValue="RYU HAJUN Ms" 
                className="text-white placeholder-white/50 focus:border-white"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-orange-100 uppercase opacity-80 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Booking Reference
            </label>
            <div className="text-xl md:text-2xl font-mono font-bold tracking-wider">
               <EditableInput 
                initialValue="EYHL7D" 
                className="text-white placeholder-white/50 focus:border-white uppercase"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

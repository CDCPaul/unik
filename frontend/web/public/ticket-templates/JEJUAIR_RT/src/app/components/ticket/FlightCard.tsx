import React from 'react';
import { Plane, Calendar, Clock, MapPin, Luggage } from 'lucide-react';
import { EditableInput } from './EditableInput';

interface FlightProps {
  flightNumber: string;
  depCity: string;
  depDate: string;
  depTime: string;
  depTerminal: string;
  arrCity: string;
  arrDate: string;
  arrTime: string;
  arrTerminal: string;
  validBefore: string;
  validAfter: string;
  bookingClass: string;
  bookingStatus: string;
  freeBaggage: string;
  seats?: string;
}

export const FlightCard = ({
  flightNumber,
  depCity,
  depDate,
  depTime,
  depTerminal,
  arrCity,
  arrDate,
  arrTime,
  arrTerminal,
  validBefore,
  validAfter,
  bookingClass,
  bookingStatus,
  freeBaggage,
  seats,
}: FlightProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden mb-6 transition-all hover:shadow-md">
      {/* Flight Header */}
      <div className="bg-slate-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2 text-orange-600 font-bold text-lg w-full">
          <Plane className="w-5 h-5 flex-shrink-0" />
          <div className="flex items-center gap-1 w-full">
            <span className="whitespace-nowrap">Flight</span>
            <EditableInput initialValue={flightNumber} className="text-orange-600 font-bold" />
          </div>
        </div>
      </div>

      {/* Main Flight Info */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-stretch gap-8 relative">
          
          {/* Departure */}
          <div className="flex-1 space-y-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Departure</div>
            <div className="text-2xl font-black text-slate-800">
              <EditableInput initialValue={depCity} />
            </div>
            <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <EditableInput initialValue={depDate} />
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <EditableInput initialValue={depTime} />
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <div className="flex items-center gap-1 w-full text-orange-600 font-bold">
                  <span className="whitespace-nowrap">Terminal</span>
                  <EditableInput initialValue={depTerminal} className="text-orange-600 font-bold" />
                </div>
              </div>
            </div>
          </div>

          {/* Visual Divider (Desktop) */}
          <div className="hidden md:flex flex-col items-center justify-center w-12 relative">
            <div className="h-full w-0.5 bg-gray-100 absolute top-0 bottom-0"></div>
            <div className="z-10 bg-white p-1 rounded-full border border-gray-200 text-gray-300">
              <Plane className="w-4 h-4 transform rotate-90" />
            </div>
          </div>

          {/* Arrival */}
          <div className="flex-1 space-y-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Arrival</div>
            <div className="text-2xl font-black text-slate-800">
              <EditableInput initialValue={arrCity} />
            </div>
             <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <EditableInput initialValue={arrDate} />
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <EditableInput initialValue={arrTime} />
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <div className="flex items-center gap-1 w-full text-orange-600 font-bold">
                  <span className="whitespace-nowrap">Terminal</span>
                  <EditableInput initialValue={arrTerminal} className="text-orange-600 font-bold" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Details Grid */}
        <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 uppercase font-semibold block">Not Valid Before</span>
            <div className="text-sm font-medium text-slate-700">
              <EditableInput initialValue={validBefore} />
            </div>
          </div>
          <div className="space-y-1">
             <span className="text-xs text-gray-400 uppercase font-semibold block">Not Valid After</span>
            <div className="text-sm font-medium text-slate-700">
              <EditableInput initialValue={validAfter} />
            </div>
          </div>
          <div className="space-y-1">
             <span className="text-xs text-gray-400 uppercase font-semibold block">Booking Class</span>
            <div className="text-sm font-medium text-slate-700">
              <EditableInput initialValue={bookingClass} />
            </div>
          </div>
          <div className="space-y-1">
             <span className="text-xs text-gray-400 uppercase font-semibold block">Booking Status</span>
            <div className="text-sm font-medium text-slate-700">
              <EditableInput initialValue={bookingStatus} />
            </div>
          </div>
          <div className="space-y-1">
             <span className="text-xs text-gray-400 uppercase font-semibold block">Seats</span>
            <div className="text-sm font-medium text-slate-700 min-h-[1.25rem]">
              <EditableInput initialValue={seats || ''} />
            </div>
          </div>
          <div className="space-y-1 col-span-1 md:col-span-3">
             <span className="text-xs text-gray-400 uppercase font-semibold block flex items-center gap-1">
                <Luggage className="w-3 h-3" />
                Free Baggage
             </span>
            <div className="text-sm font-bold text-slate-700">
              <EditableInput initialValue={freeBaggage} className="font-bold" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

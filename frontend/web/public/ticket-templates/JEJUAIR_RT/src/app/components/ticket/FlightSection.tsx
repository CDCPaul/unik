import React from 'react';
import { FlightCard } from './FlightCard';
import { EditableInput } from './EditableInput';

export const FlightSection = () => {
  return (
    <div className="mb-8">
      <FlightCard
        flightNumber="7C 2406"
        depCity="CEBU"
        depDate="27 OCT 2025"
        depTime="01:20"
        depTerminal="2"
        arrCity="SEOUL(INCHEON)"
        arrDate="27 OCT 2025"
        arrTime="06:55"
        arrTerminal="1"
        validBefore="27 OCT 2025"
        validAfter="27 OCT 2025"
        bookingClass="F (Special fare)"
        bookingStatus="OK"
        freeBaggage="15kg"
      />
      
      <FlightCard
        flightNumber="7C 2405"
        depCity="SEOUL(INCHEON)"
        depDate="31 OCT 2025"
        depTime="20:20"
        depTerminal="1"
        arrCity="CEBU"
        arrDate="1 NOV 2025"
        arrTime="00:10"
        arrTerminal="2"
        validBefore="31 OCT 2025"
        validAfter="31 OCT 2025"
        bookingClass="F (Special fare)"
        bookingStatus="OK"
        freeBaggage="15kg"
      />

      <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-center">
        <div className="text-red-500 font-medium text-sm">
          <EditableInput initialValue="Please verify flight times prior to departure" className="text-center w-full" />
        </div>
      </div>
    </div>
  );
};

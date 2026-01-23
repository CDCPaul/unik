import React from 'react';
import { AlertCircle } from 'lucide-react';
import { EditableInput } from './EditableInput';

export const NoticeSection = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500 mb-8">
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
        <h3 className="font-semibold text-gray-800">
          <EditableInput initialValue="Important Information" />
        </h3>
      </div>
      <ul className="space-y-2 text-sm text-gray-600 leading-relaxed">
        <li className="flex gap-2">
          <span className="flex-shrink-0">-</span>
          <div className="w-full">
            <EditableInput 
              initialValue="For changes or cancellation of flight tickets, please contact to the initial place of purchase." 
              multiline={true}
            />
          </div>
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0">-</span>
          <div className="w-full">
            <EditableInput 
              initialValue="Boarding process is closed before 60 minutes of departure of the related flight. for smooth boarding process, please be arrived to the airport before 2 hours of departure." 
              multiline={true}
            />
          </div>
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0">-</span>
          <div className="w-full">
            <EditableInput 
              initialValue="Your International E-Ticket must be used in order,if not,your ticket would be invalid." 
              multiline={true}
            />
          </div>
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0">*</span>
          <div className="w-full">
             <EditableInput 
              initialValue="Allowance for international routes (except for the routes to/from America): 1 pieces =15KG (Exception: Booking Class Y 1 pieces =20KG)" 
              multiline={true}
            />
          </div>
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0">*</span>
          <div className="w-full">
            <EditableInput 
              initialValue="Allowance for Routes to/from America (Guam/Saipan): 1 pieces =23KG" 
              multiline={true}
            />
          </div>
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0">-</span>
          <div className="w-full">
            <EditableInput 
              initialValue="Terms and Conditions of purchased ticket is applied JEJUAIR" 
              multiline={true}
            />
          </div>
        </li>
      </ul>
    </div>
  );
};

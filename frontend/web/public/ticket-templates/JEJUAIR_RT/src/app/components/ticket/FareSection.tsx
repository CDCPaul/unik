import React from 'react';
import { CreditCard } from 'lucide-react';
import { EditableInput } from './EditableInput';

export const FareSection = () => {
  const fareItems = [
    { label: "Agent Name", value: "Cebu Direct Club Travel & Tours", highlight: false },
    { label: "Date of Issue", value: "20 AUG 2024", highlight: false },
    { label: "Notes", value: "CEF", highlight: false },
    { label: "Form of Payment",value: "CASH", highlight: false },
    { label: "Fare Amount", value: "PHP", highlight: false },
    { label: "Fuel Surcharge", value: "PHP", highlight: false },
    { label: "Tax", value: "PHP", highlight: false },
    { label: "Change Fee", value: "PHP 0", highlight: false },
    { label: "Total Amount", value: "PHP 0.00", highlight: true },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden mb-8">
      <div className="bg-gray-400 px-6 py-3 border-b border-gray-200">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Ticket & Fare Information
        </h2>
      </div>
      <div className="p-0">
        <table className="w-full text-sm">
          <tbody>
            {fareItems.map((item, index) => (
              <tr 
                key={index} 
                className={`
                  ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} 
                  ${item.highlight ? 'bg-orange-50 font-bold' : ''}
                  border-b border-gray-50 last:border-0
                `}
              >
                <td className="px-6 py-4 text-gray-500 font-medium w-1/3 md:w-1/4">
                  {item.label}
                </td>
                <td className={`px-6 py-4 ${item.highlight ? 'text-orange-600 text-lg' : 'text-slate-800'}`}>
                  <EditableInput 
                    initialValue={item.value} 
                    className={item.highlight ? 'text-orange-600 font-bold' : ''}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

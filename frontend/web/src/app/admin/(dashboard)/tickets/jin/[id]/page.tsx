'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Plane, Calendar, Users, MapPin, 
  Edit, Save, X, Loader2, Download,
  Eye
} from 'lucide-react';
import { getTicket, updateTicket } from '@/lib/services/admin/tickets';
import { generatePdfFromReactPDF, downloadPdf } from '@/lib/utils/pdf';
import JinAirTicket from '@/components/tickets/JinAirTicket';
import JinAirTicketPDF from '@/components/tickets/JinAirTicketPDF';
import type { AirlineTicket, TicketPassenger, ExtraService, FareInformation, CurrencyType, PaymentMethodType } from '@unik/shared/types';

export default function JinAirTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<AirlineTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedPassengers, setSelectedPassengers] = useState<number[]>([]);

  // Edit form state
  const [agentName, setAgentName] = useState('');
  const [notes, setNotes] = useState('');
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [passengers, setPassengers] = useState<TicketPassenger[]>([]);
  const [fareInfo, setFareInfo] = useState<FareInformation>({});
  const [journeys, setJourneys] = useState<AirlineTicket['journeys']>([]);

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  useEffect(() => {
    if (ticket) {
      // Select all passengers by default
      setSelectedPassengers(ticket.passengers.map((_, idx) => idx));
    }
  }, [ticket]);

  useEffect(() => {
    if (ticket && isEditing) {
      // Ensure edit state uses a fresh copy of journeys
      setJourneys(ticket.journeys?.map(journey => ({ ...journey })) || []);
    }
  }, [ticket, isEditing]);

  const handlePreviewTicket = (passengerIdx: number) => {
    const passenger = passengers[passengerIdx];
    if (!ticket || !passenger) return;

    // Open new window
    const previewWindow = window.open('', '_blank', 'width=1200,height=1200,menubar=no,toolbar=no,location=no,status=no');
    if (!previewWindow) {
      alert('Popup was blocked. Please allow popups.');
      return;
    }

    // Get the ticket element HTML
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    // Import React and ReactDOM for rendering
    import('react-dom/client').then((ReactDOM) => {
      import('react').then((React) => {
        const root = ReactDOM.createRoot(tempDiv);
        
        root.render(
          React.createElement(JinAirTicket, { ticket, passenger })
        );

        // Wait for render and then get HTML
        setTimeout(() => {
          const ticketHTML = tempDiv.innerHTML;
          document.body.removeChild(tempDiv);

          // Write to new window
          previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Jin Air Ticket Preview - ${passenger.lastName} ${passenger.firstName}</title>
                <style>
                  * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                  }
                  body {
                    margin: 0;
                    padding: 20px;
                    background: #f5f5f5;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    min-height: 100vh;
                  }
                  .print-button {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                    z-index: 1000;
                  }
                  .print-button:hover {
                    background: #2563eb;
                  }
                  @media print {
                    @page {
                      size: A4;
                      margin: 0;
                    }
                    html, body {
                      width: 210mm;
                      height: 297mm;
                      margin: 0;
                      padding: 0;
                      overflow: hidden;
                    }
                    body {
                      background: white;
                      display: block;
                    }
                    .print-button {
                      display: none;
                    }
                    * {
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                      color-adjust: exact !important;
                    }
                  }
                </style>
              </head>
              <body>
                <button class="print-button" onclick="window.print()">🖨️ Print</button>
                ${ticketHTML}
              </body>
            </html>
          `);
          previewWindow.document.close();
        }, 100);
      });
    });
  };

  const loadTicket = async () => {
    setIsLoading(true);
    try {
      const data = await getTicket(ticketId);
      if (data) {
        // Verify it's a Jin Air ticket
        if (data.airline !== 'JIN') {
          alert('This page is for Jin Air tickets only.');
          router.push('/admin/tickets');
          return;
        }
        
        setTicket(data);
        setAgentName(data.agentName);
        setNotes(data.notes || '');
        setExtraServices(data.extraServices || []);
        setPassengers(data.passengers || []);
        setFareInfo(data.fareInformation || {});
        setJourneys(data.journeys || []);
      } else {
        alert('Ticket not found.');
        router.push('/admin/tickets');
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
      alert('Failed to load ticket.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!ticket) return;

    setIsSaving(true);
    try {
      await updateTicket(ticketId, {
        agentName,
        notes,
        extraServices: extraServices.filter(s => s.name || s.data),
        passengers,
        fareInformation: fareInfo,
        journeys
      });
      
      alert('Ticket updated successfully.');
      setIsEditing(false);
      await loadTicket();
    } catch (error) {
      console.error('Error saving ticket:', error);
      alert('Failed to update ticket.');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePassenger = (index: number, field: keyof TicketPassenger, value: string) => {
    setPassengers(prev => prev.map((p, idx) => 
      idx === index ? { ...p, [field]: value } : p
    ));
  };

  const updateJourney = (index: number, field: keyof AirlineTicket['journeys'][number], value: string) => {
    setJourneys(prev => prev.map((j, idx) => 
      idx === index ? { ...j, [field]: value } : j
    ));
  };

  const handleGeneratePdf = async (passengerIndex?: number) => {
    if (!ticket) return;

    setIsGeneratingPdf(true);
    try {
      if (typeof passengerIndex === 'number') {
        // Generate single PDF
        const passenger = passengers[passengerIndex];
        const filename = `JIN_${ticket.reservationNumber}_${passenger.lastName}_${passenger.firstName}.pdf`;
        
        const pdfBlob = await generatePdfFromReactPDF(
          <JinAirTicketPDF ticket={ticket} passenger={passenger} />,
          filename
        );
        
        downloadPdf(pdfBlob, filename);
        
        alert(`PDF가 생성되었습니다: ${filename}`);
      } else {
        // Generate PDFs for selected passengers only
        const passengersToGenerate = selectedPassengers.length > 0 
          ? selectedPassengers 
          : passengers.map((_, idx) => idx);

        if (passengersToGenerate.length === 0) {
          alert('Please select passengers to generate PDFs for.');
          return;
        }

        for (const i of passengersToGenerate) {
          const passenger = passengers[i];
          const filename = `JIN_${ticket.reservationNumber}_${passenger.lastName}_${passenger.firstName}.pdf`;
          
          const pdfBlob = await generatePdfFromReactPDF(
            <JinAirTicketPDF ticket={ticket} passenger={passenger} />,
            filename
          );
          
          downloadPdf(pdfBlob, filename);
          
          // Wait a bit between downloads
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        alert(`${passengersToGenerate.length} PDF(s) generated successfully!`);
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const togglePassengerSelection = (index: number) => {
    setSelectedPassengers(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const toggleAllPassengers = () => {
    if (selectedPassengers.length === passengers.length) {
      setSelectedPassengers([]);
    } else {
      setSelectedPassengers(passengers.map((_, idx) => idx));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin/tickets" className="text-slate-500 hover:text-slate-700">
              ← Back to List
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="px-3 py-1 text-sm rounded-lg bg-purple-100 text-purple-800 border border-purple-200">
              Jin Air (JIN)
            </span>
            Ticket Details
          </h1>
          <p className="text-slate-500 mt-1">Reservation Number: {ticket.reservationNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="admin-btn-secondary"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button 
                onClick={() => handleGeneratePdf()}
                disabled={isGeneratingPdf || passengers.length === 0}
                className="admin-btn-primary"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Generate All PDFs
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setAgentName(ticket.agentName);
                  setNotes(ticket.notes || '');
                  setExtraServices(ticket.extraServices || []);
                  setPassengers(ticket.passengers || []);
                  setFareInfo(ticket.fareInformation || {});
                  setJourneys(ticket.journeys || []);
                }}
                className="admin-btn-secondary"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="admin-btn-primary"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Basic Info */}
      <div className="admin-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Journey Type</label>
            <p className="text-sm font-medium text-slate-700">
              {ticket.journeyType === 'round-trip' ? 'Round-trip' : 'One-way'}
            </p>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Booking Type</label>
            <p className="text-sm font-medium text-slate-700">
              {ticket.isGroupBooking ? `Group Booking (${ticket.totalSeats} seats)` : 'Individual Booking'}
            </p>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Booking Date</label>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400" />
              {ticket.bookingDate}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Passengers</label>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Users className="w-4 h-4 text-slate-400" />
              {ticket.passengers.length} pax
            </div>
          </div>
        </div>
      </div>

      {/* Journey Info */}
      <div className="admin-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Journey Information</h2>
        <div className="space-y-4">
          {(isEditing ? journeys : ticket.journeys).map((journey, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                  {idx === 0 ? 'Outbound' : 'Inbound'}
                </span>
                <span className="text-sm font-bold text-slate-900">{journey.flightNumber}</span>
                {journey.bookingClass && (
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    Class {journey.bookingClass}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Departure */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" />
                    Departure
                  </div>
                  <div className="pl-5">
                    <p className="font-bold text-slate-900">
                      {journey.departureAirportCode} - {journey.departureAirportName}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {journey.departureDate} {journey.departureTime}
                    </p>
                    {journey.departureTerminal && (
                      <p className="text-xs text-slate-500 mt-1">
                        Terminal {journey.departureTerminal}
                      </p>
                    )}
                  </div>
                </div>

                {/* Arrival */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" />
                    Arrival
                  </div>
                  <div className="pl-5">
                    <p className="font-bold text-slate-900">
                      {journey.arrivalAirportCode} - {journey.arrivalAirportName}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {journey.arrivalDate} {journey.arrivalTime}
                    </p>
                    {journey.arrivalTerminal && (
                      <p className="text-xs text-slate-500 mt-1">
                        Terminal {journey.arrivalTerminal}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Baggage Allowance</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={journey.baggageAllowance || ''}
                    onChange={(e) => updateJourney(idx, 'baggageAllowance', e.target.value)}
                    className="admin-input text-sm"
                    placeholder="e.g. 15kg"
                  />
                ) : (
                  <p className="text-xs text-slate-600">
                    {journey.baggageAllowance ? (
                      <span className="font-medium text-slate-700">{journey.baggageAllowance}</span>
                    ) : (
                      '-'
                    )}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Passenger List */}
      <div className="admin-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Passenger List ({passengers.length} pax)
          </h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-800">
              <input
                type="checkbox"
                checked={selectedPassengers.length === passengers.length}
                onChange={toggleAllPassengers}
                className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
              />
              <span className="font-medium">Select All</span>
            </label>
            <div className="text-sm text-slate-500">
              {selectedPassengers.length > 0 && `${selectedPassengers.length} selected`}
            </div>
          </div>
        </div>
        {passengers.length === 0 ? (
          <p className="text-sm text-slate-500">No passenger information.</p>
        ) : (
          <>
            <div className="space-y-3">
              {passengers.map((passenger, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedPassengers.includes(idx)}
                    onChange={() => togglePassengerSelection(idx)}
                    className="w-5 h-5 text-purple-600 border-slate-300 rounded focus:ring-purple-500 shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-slate-700">Passenger {idx + 1}</span>
                      {!isEditing && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePreviewTicket(idx)}
                            className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                            title="Preview in new window"
                          >
                            <Eye className="w-3 h-3" />
                            Preview
                          </button>
                          <button
                            onClick={() => handleGeneratePdf(idx)}
                            disabled={isGeneratingPdf}
                            className="px-3 py-1 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <Download className="w-3 h-3" />
                            PDF
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {isEditing ? (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Last Name</label>
                          <input
                            type="text"
                            value={passenger.lastName}
                            onChange={(e) => updatePassenger(idx, 'lastName', e.target.value)}
                            className="admin-input text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">First Name</label>
                          <input
                            type="text"
                            value={passenger.firstName}
                            onChange={(e) => updatePassenger(idx, 'firstName', e.target.value)}
                            className="admin-input text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Gender</label>
                          <select
                            value={passenger.gender}
                            onChange={(e) => updatePassenger(idx, 'gender', e.target.value as TicketPassenger['gender'])}
                            className="admin-input text-sm"
                          >
                            <option value="">Select</option>
                            <option value="Mr">Mr</option>
                            <option value="Ms">Ms</option>
                            <option value="Mrs">Mrs</option>
                            <option value="Miss">Miss</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Ticket Number (Optional)</label>
                          <input
                            type="text"
                            value={passenger.ticketNumber || ''}
                            onChange={(e) => updatePassenger(idx, 'ticketNumber', e.target.value)}
                            className="admin-input text-sm"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-xs text-slate-500">Last Name:</span>
                          <p className="font-medium text-slate-900">{passenger.lastName}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500">First Name:</span>
                          <p className="font-medium text-slate-900">{passenger.firstName}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500">Gender:</span>
                          <p className="font-medium text-slate-900">{passenger.gender || '-'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500">Ticket Number:</span>
                          <p className="font-medium text-slate-900">{passenger.ticketNumber || '-'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {!isEditing && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleGeneratePdf()}
                  disabled={isGeneratingPdf || selectedPassengers.length === 0}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Generate PDF for Selected ({selectedPassengers.length} pax)
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Additional Info */}
      <div className="admin-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Additional Information</h2>
        
        <div className="space-y-4">
          {/* Agent Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Agent Name</label>
            {isEditing ? (
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="admin-input"
              />
            ) : (
              <p className="text-sm text-slate-900">{agentName}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
            {isEditing ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="admin-input"
                rows={3}
              />
            ) : (
              <p className="text-sm text-slate-900">{notes || '-'}</p>
            )}
          </div>

          {/* Extra Services */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Extra Services</label>
            {isEditing ? (
              <div className="space-y-2">
                {extraServices.map((service, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-8">{idx + 1}.</span>
                    <input
                      type="text"
                      value={service.name}
                      onChange={(e) => {
                        const newServices = [...extraServices];
                        newServices[idx].name = e.target.value;
                        setExtraServices(newServices);
                      }}
                      className="admin-input text-sm flex-1"
                      placeholder="Service Name"
                    />
                    <input
                      type="text"
                      value={service.data}
                      onChange={(e) => {
                        const newServices = [...extraServices];
                        newServices[idx].data = e.target.value;
                        setExtraServices(newServices);
                      }}
                      className="admin-input text-sm flex-1"
                      placeholder="Details"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {extraServices.filter(s => s.name || s.data).length === 0 ? (
                  <p className="text-sm text-slate-500">-</p>
                ) : (
                  extraServices.filter(s => s.name || s.data).map((service, idx) => (
                    <p key={idx} className="text-sm text-slate-900">
                      {service.name}: {service.data}
                    </p>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fare Information */}
      <div className="admin-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Fare Information (Optional)</h2>
        
        {isEditing ? (
          <div className="space-y-4">
            {/* Form of Payment */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Form of Payment</label>
              <select
                value={fareInfo.formOfPayment || ''}
                onChange={(e) => setFareInfo({...fareInfo, formOfPayment: e.target.value as PaymentMethodType || undefined})}
                className="admin-input"
              >
                <option value="">-Select-</option>
                <option value="CASH">CASH</option>
                <option value="CREDIT_CARD">CREDIT CARD</option>
                <option value="BANK_TRANSFER">BANK TRANSFER</option>
              </select>
            </div>

            {/* Fare Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fare Amount</label>
              <div className="flex gap-2">
                <select
                  value={fareInfo.fareAmount?.currency || 'PHP'}
                  onChange={(e) => setFareInfo({
                    ...fareInfo, 
                    fareAmount: {
                      currency: e.target.value as CurrencyType,
                      value: fareInfo.fareAmount?.value || ''
                    }
                  })}
                  className="admin-input w-32"
                >
                  <option value="PHP">PHP</option>
                  <option value="USD">USD</option>
                  <option value="KRW">KRW</option>
                </select>
                <input
                  type="text"
                  value={fareInfo.fareAmount?.value || ''}
                  onChange={(e) => setFareInfo({
                    ...fareInfo,
                    fareAmount: {
                      currency: fareInfo.fareAmount?.currency || 'PHP',
                      value: e.target.value
                    }
                  })}
                  className="admin-input flex-1"
                  placeholder="Amount"
                />
              </div>
            </div>

            {/* Fuel Surcharge */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fuel Surcharge</label>
              <div className="flex gap-2">
                <select
                  value={fareInfo.fuelSurcharge?.currency || 'PHP'}
                  onChange={(e) => setFareInfo({
                    ...fareInfo, 
                    fuelSurcharge: {
                      currency: e.target.value as CurrencyType,
                      value: fareInfo.fuelSurcharge?.value || ''
                    }
                  })}
                  className="admin-input w-32"
                >
                  <option value="PHP">PHP</option>
                  <option value="USD">USD</option>
                  <option value="KRW">KRW</option>
                </select>
                <input
                  type="text"
                  value={fareInfo.fuelSurcharge?.value || ''}
                  onChange={(e) => setFareInfo({
                    ...fareInfo,
                    fuelSurcharge: {
                      currency: fareInfo.fuelSurcharge?.currency || 'PHP',
                      value: e.target.value
                    }
                  })}
                  className="admin-input flex-1"
                  placeholder="Amount"
                />
              </div>
            </div>

            {/* Tax */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tax</label>
              <div className="flex gap-2">
                <select
                  value={fareInfo.tax?.currency || 'PHP'}
                  onChange={(e) => setFareInfo({
                    ...fareInfo, 
                    tax: {
                      currency: e.target.value as CurrencyType,
                      value: fareInfo.tax?.value || ''
                    }
                  })}
                  className="admin-input w-32"
                >
                  <option value="PHP">PHP</option>
                  <option value="USD">USD</option>
                  <option value="KRW">KRW</option>
                </select>
                <input
                  type="text"
                  value={fareInfo.tax?.value || ''}
                  onChange={(e) => setFareInfo({
                    ...fareInfo,
                    tax: {
                      currency: fareInfo.tax?.currency || 'PHP',
                      value: e.target.value
                    }
                  })}
                  className="admin-input flex-1"
                  placeholder="Amount"
                />
              </div>
            </div>

            {/* Change Fee */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Change Fee</label>
              <div className="flex gap-2">
                <select
                  value={fareInfo.changeFee?.currency || 'PHP'}
                  onChange={(e) => setFareInfo({
                    ...fareInfo, 
                    changeFee: {
                      currency: e.target.value as CurrencyType,
                      value: fareInfo.changeFee?.value || ''
                    }
                  })}
                  className="admin-input w-32"
                >
                  <option value="PHP">PHP</option>
                  <option value="USD">USD</option>
                  <option value="KRW">KRW</option>
                </select>
                <input
                  type="text"
                  value={fareInfo.changeFee?.value || ''}
                  onChange={(e) => setFareInfo({
                    ...fareInfo,
                    changeFee: {
                      currency: fareInfo.changeFee?.currency || 'PHP',
                      value: e.target.value
                    }
                  })}
                  className="admin-input flex-1"
                  placeholder="Amount"
                />
              </div>
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Total Amount</label>
              <div className="flex gap-2">
                <select
                  value={fareInfo.totalAmount?.currency || 'PHP'}
                  onChange={(e) => setFareInfo({
                    ...fareInfo, 
                    totalAmount: {
                      currency: e.target.value as CurrencyType,
                      value: fareInfo.totalAmount?.value || ''
                    }
                  })}
                  className="admin-input w-32"
                >
                  <option value="PHP">PHP</option>
                  <option value="USD">USD</option>
                  <option value="KRW">KRW</option>
                </select>
                <input
                  type="text"
                  value={fareInfo.totalAmount?.value || ''}
                  onChange={(e) => setFareInfo({
                    ...fareInfo,
                    totalAmount: {
                      currency: fareInfo.totalAmount?.currency || 'PHP',
                      value: e.target.value
                    }
                  })}
                  className="admin-input flex-1"
                  placeholder="Amount"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {!fareInfo.formOfPayment && !fareInfo.fareAmount && !fareInfo.fuelSurcharge && 
             !fareInfo.tax && !fareInfo.changeFee && !fareInfo.totalAmount ? (
              <p className="text-sm text-slate-500">No fare information entered.</p>
            ) : (
              <>
                {fareInfo.formOfPayment && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Form of Payment:</span>
                    <span className="font-medium text-slate-900">{fareInfo.formOfPayment}</span>
                  </div>
                )}
                {fareInfo.fareAmount && fareInfo.fareAmount.value && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Fare Amount:</span>
                    <span className="font-medium text-slate-900">
                      {fareInfo.fareAmount.currency} {fareInfo.fareAmount.value}
                    </span>
                  </div>
                )}
                {fareInfo.fuelSurcharge && fareInfo.fuelSurcharge.value && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Fuel Surcharge:</span>
                    <span className="font-medium text-slate-900">
                      {fareInfo.fuelSurcharge.currency} {fareInfo.fuelSurcharge.value}
                    </span>
                  </div>
                )}
                {fareInfo.tax && fareInfo.tax.value && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tax:</span>
                    <span className="font-medium text-slate-900">
                      {fareInfo.tax.currency} {fareInfo.tax.value}
                    </span>
                  </div>
                )}
                {fareInfo.changeFee && fareInfo.changeFee.value && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Change Fee:</span>
                    <span className="font-medium text-slate-900">
                      {fareInfo.changeFee.currency} {fareInfo.changeFee.value}
                    </span>
                  </div>
                )}
                {fareInfo.totalAmount && fareInfo.totalAmount.value && (
                  <div className="flex justify-between text-sm border-t pt-2 mt-2">
                    <span className="text-slate-600 font-semibold">Total Amount:</span>
                    <span className="font-bold text-slate-900">
                      {fareInfo.totalAmount.currency} {fareInfo.totalAmount.value}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



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
import type { AirlineTicket, TicketPassenger, ExtraService, FlightJourney } from '@unik/shared/types';
import AirBusanTicket from '@/components/tickets/AirBusanTicket';
import AirBusanTicketPDF from '@/components/tickets/AirBusanTicketPDF';
import { generatePdfFromReactPDF } from '@/lib/utils/pdf';

export default function AirBusanTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  // Airport code to name mapping
  const AIRPORT_MAP: Record<string, string> = {
    'CEB': 'CEBU(MACTAN-CEBU)',
    'PUS': 'BUSAN(GIMHAE)',
    'CJU': 'JEJU'
  };
  
  const AIRPORT_CODES = ['CEB', 'PUS', 'CJU'];
  const TERMINALS = ['1', '2', '3', '4'];

  // Helper functions for date conversion
  const convertToDateInput = (dateStr: string): string => {
    if (!dateStr) return '';
    const months: Record<string, string> = {
      'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
      'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
      'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
    };
    const parts = dateStr.trim().split(/\s+/);
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = months[parts[1].toUpperCase()];
      const year = parts[2];
      if (month) return `${year}-${month}-${day}`;
    }
    return '';
  };

  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const [year, month, day] = dateStr.split('-');
    const monthName = months[parseInt(month) - 1];
    return `${parseInt(day).toString().padStart(2, '0')} ${monthName} ${year}`;
  };

  const [ticket, setTicket] = useState<AirlineTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedPassengers, setSelectedPassengers] = useState<number[]>([]);

  // Edit form state
  const [agentName, setAgentName] = useState('');
  const [notes, setNotes] = useState('');
  const [journeys, setJourneys] = useState<FlightJourney[]>([]);

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  useEffect(() => {
    if (ticket) {
      // Select all passengers by default
      setSelectedPassengers(ticket.passengers.map((_, idx) => idx));
    }
  }, [ticket]);

  const loadTicket = async () => {
    setIsLoading(true);
    try {
      const data = await getTicket(ticketId);
      if (data) {
        setTicket(data);
        setAgentName(data.agentName || '');
        setNotes(data.notes || '');
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

  // Handle journey field change
  const handleJourneyChange = (index: number, field: keyof FlightJourney, value: string) => {
    const updated = [...journeys];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-update airport name when code changes
    if (field === 'departureAirportCode' && AIRPORT_MAP[value]) {
      updated[index].departureAirportName = AIRPORT_MAP[value];
    }
    if (field === 'arrivalAirportCode' && AIRPORT_MAP[value]) {
      updated[index].arrivalAirportName = AIRPORT_MAP[value];
    }
    
    setJourneys(updated);
  };

  const handleSave = async () => {
    if (!ticket) return;

    setIsSaving(true);
    try {
      await updateTicket(ticketId, {
        agentName,
        notes,
        journeys
      });
      
      alert('Saved successfully!');
      setIsEditing(false);
      await loadTicket();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (ticket) {
      setAgentName(ticket.agentName || '');
      setNotes(ticket.notes || '');
      setJourneys(ticket.journeys || []);
    }
    setIsEditing(false);
  };

  // Toggle passenger selection
  const togglePassengerSelection = (index: number) => {
    setSelectedPassengers(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Toggle all passengers
  const toggleAllPassengers = () => {
    if (selectedPassengers.length === ticket?.passengers.length) {
      setSelectedPassengers([]);
    } else {
      setSelectedPassengers(ticket?.passengers.map((_, idx) => idx) || []);
    }
  };

  // Generate and download PDFs
  const handleDownloadPdfs = async () => {
    if (!ticket) return;

    setIsGeneratingPdf(true);
    try {
      // If no passengers selected, download all
      // If some/all selected, download selected only
      const passengersToDownload = selectedPassengers.length === 0 
        ? ticket.passengers.map((_, idx) => idx)
        : selectedPassengers;

      for (const index of passengersToDownload) {
        const passenger = ticket.passengers[index];
        const filename = `AirBusan_${ticket.reservationNumber}_${passenger.lastName}${passenger.firstName}.pdf`;
        const pdfBlob = await generatePdfFromReactPDF(
          <AirBusanTicketPDF ticket={ticket} passenger={passenger} />,
          filename
        );

        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Small delay between downloads
        if (index !== passengersToDownload[passengersToDownload.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      alert(`${passengersToDownload.length} PDF(s) downloaded.`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Download individual passenger PDF
  const handleDownloadIndividualPdf = async (passengerIndex: number) => {
    if (!ticket) return;

    try {
      const passenger = ticket.passengers[passengerIndex];
      const filename = `AirBusan_${ticket.reservationNumber}_${passenger.lastName}${passenger.firstName}.pdf`;
      const pdfBlob = await generatePdfFromReactPDF(
        <AirBusanTicketPDF ticket={ticket} passenger={passenger} />,
        filename
      );

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF.');
    }
  };

  // Show preview in new window
  const handleShowPreview = (passengerIndex: number) => {
    if (!ticket) return;
    const passenger = ticket.passengers[passengerIndex];
    
    // Open new window
    const previewWindow = window.open('', '_blank', 'width=900,height=1200,menubar=no,toolbar=no,location=no,status=no');
    if (!previewWindow) {
      alert('Popup was blocked. Please allow popups.');
      return;
    }

    // Render the ticket component to get HTML
    import('react-dom/client').then(({ default: ReactDOM }) => {
      import('react').then(({ default: React }) => {
        const tempDiv = document.createElement('div');
        const root = ReactDOM.createRoot(tempDiv);
        
        root.render(React.createElement(AirBusanTicket, { ticket, passenger }));
        
        setTimeout(() => {
          const ticketHtml = tempDiv.innerHTML;
          
          previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Air Busan Ticket Preview - ${passenger.lastName} ${passenger.firstName}</title>
                <style>
                  * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                  }
                  @media print {
                    * {
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                      color-adjust: exact !important;
                    }
                    body {
                      margin: 0;
                      padding: 0;
                    }
                    @page {
                      size: A4;
                      margin: 0;
                    }
                  }
                  body {
                    margin: 0;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                  }
                  .print-button {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 24px;
                    background-color: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                  }
                  .print-button:hover {
                    background-color: #2563eb;
                  }
                  @media print {
                    .print-button {
                      display: none;
                    }
                  }
                </style>
              </head>
              <body>
                <button class="print-button" onclick="window.print()">🖨️ Print</button>
                ${ticketHtml}
              </body>
            </html>
          `);
          
          previewWindow.document.close();
        }, 100);
      });
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">티켓을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/admin/tickets"
            className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block"
          >
            ← Back to List
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Plane className="w-8 h-8 text-blue-600" />
            Air Busan Ticket Details
          </h1>
          <p className="text-slate-500 mt-1">Reservation Number: {ticket.reservationNumber}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownloadPdfs}
            disabled={isGeneratingPdf}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {selectedPassengers.length === 0 
                  ? `Download All PDFs (${ticket.passengers.length})`
                  : `Download Selected PDFs (${selectedPassengers.length})`
                }
              </>
            )}
          </button>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </button>
            </>
          )}
        </div>
      </div>

      {/* Top Row: Journey Info (Left) + Booking Info (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Journey Information (2/3 width) */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-slate-200"
          >
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Journey Information
            </h2>

            <div className="space-y-4">
              {(isEditing ? journeys : ticket.journeys).map((journey, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-medium text-slate-700 mb-3">Journey {index + 1}</h3>
                  
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Editable fields - same as creation page */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Flight Number</label>
                        <input
                          type="text"
                          value={journey.flightNumber}
                          onChange={(e) => handleJourneyChange(index, 'flightNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Departure Airport Code</label>
                        <select
                          value={journey.departureAirportCode}
                          onChange={(e) => handleJourneyChange(index, 'departureAirportCode', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                        >
                          <option value="">선택하세요</option>
                          {AIRPORT_CODES.map(code => (
                            <option key={code} value={code}>{code}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Departure Airport Name</label>
                        <input
                          type="text"
                          value={journey.departureAirportName}
                          readOnly
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Departure일자</label>
                        <input
                          type="date"
                          value={journey.departureDate ? convertToDateInput(journey.departureDate) : ''}
                          onChange={(e) => handleJourneyChange(index, 'departureDate', formatDateForDisplay(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Departure Time</label>
                        <div className="flex gap-2">
                          <select
                            value={journey.departureTime.split(':')[0] || '00'}
                            onChange={(e) => {
                              const [, min] = journey.departureTime.split(':');
                              handleJourneyChange(index, 'departureTime', `${e.target.value}:${min || '00'}`);
                            }}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}시
                              </option>
                            ))}
                          </select>
                          <select
                            value={journey.departureTime.split(':')[1] || '00'}
                            onChange={(e) => {
                              const [hour] = journey.departureTime.split(':');
                              handleJourneyChange(index, 'departureTime', `${hour || '00'}:${e.target.value}`);
                            }}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                          >
                            {Array.from({ length: 12 }, (_, i) => {
                              const min = (i * 5).toString().padStart(2, '0');
                              return <option key={i} value={min}>{min}분</option>;
                            })}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Departure Terminal</label>
                        <select
                          value={journey.departureTerminal}
                          onChange={(e) => handleJourneyChange(index, 'departureTerminal', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                        >
                          <option value="">선택하세요</option>
                          {TERMINALS.map(terminal => (
                            <option key={terminal} value={terminal}>{terminal}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Arrival Airport Code</label>
                        <select
                          value={journey.arrivalAirportCode}
                          onChange={(e) => handleJourneyChange(index, 'arrivalAirportCode', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                        >
                          <option value="">선택하세요</option>
                          {AIRPORT_CODES.map(code => (
                            <option key={code} value={code}>{code}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Arrival Airport Name</label>
                        <input
                          type="text"
                          value={journey.arrivalAirportName}
                          readOnly
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Arrival일자</label>
                        <input
                          type="date"
                          value={journey.arrivalDate ? convertToDateInput(journey.arrivalDate) : ''}
                          onChange={(e) => handleJourneyChange(index, 'arrivalDate', formatDateForDisplay(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Arrival Time</label>
                        <div className="flex gap-2">
                          <select
                            value={journey.arrivalTime.split(':')[0] || '00'}
                            onChange={(e) => {
                              const [, min] = journey.arrivalTime.split(':');
                              handleJourneyChange(index, 'arrivalTime', `${e.target.value}:${min || '00'}`);
                            }}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}시
                              </option>
                            ))}
                          </select>
                          <select
                            value={journey.arrivalTime.split(':')[1] || '00'}
                            onChange={(e) => {
                              const [hour] = journey.arrivalTime.split(':');
                              handleJourneyChange(index, 'arrivalTime', `${hour || '00'}:${e.target.value}`);
                            }}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                          >
                            {Array.from({ length: 12 }, (_, i) => {
                              const min = (i * 5).toString().padStart(2, '0');
                              return <option key={i} value={min}>{min}분</option>;
                            })}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Arrival Terminal</label>
                        <select
                          value={journey.arrivalTerminal}
                          onChange={(e) => handleJourneyChange(index, 'arrivalTerminal', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                        >
                          <option value="">선택하세요</option>
                          {TERMINALS.map(terminal => (
                            <option key={terminal} value={terminal}>{terminal}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Baggage</label>
                        <input
                          type="text"
                          value={journey.baggageAllowance}
                          onChange={(e) => handleJourneyChange(index, 'baggageAllowance', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="block text-slate-600 mb-1">Flight</label>
                        <p className="text-slate-900 font-medium">{journey.flightNumber}</p>
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">Class</label>
                        <p className="text-slate-900">{journey.bookingClass}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-slate-600 mb-1">Departure</label>
                        <p className="text-slate-900">
                          {journey.departureAirportCode} - {journey.departureAirportName}
                        </p>
                        <p className="text-slate-700 text-xs mt-1">
                          {journey.departureDate} {journey.departureTime}
                          {journey.departureTerminal && ` (Terminal ${journey.departureTerminal})`}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-slate-600 mb-1">Arrival</label>
                        <p className="text-slate-900">
                          {journey.arrivalAirportCode} - {journey.arrivalAirportName}
                        </p>
                        <p className="text-slate-700 text-xs mt-1">
                          {journey.arrivalDate} {journey.arrivalTime}
                          {journey.arrivalTerminal && ` (Terminal ${journey.arrivalTerminal})`}
                        </p>
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">Baggage</label>
                        <p className="text-slate-900">{journey.baggageAllowance}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: Booking Info (1/3 width) */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-slate-200"
          >
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Booking Information
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Reservation Number</label>
                <p className="text-slate-900 font-medium">{ticket.reservationNumber}</p>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Booking Date</label>
                <p className="text-slate-900">{ticket.bookingDate || '-'}</p>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Journey Type</label>
                <p className="text-slate-900">
                  {ticket.journeyType === 'one-way' ? 'One-way' : 
                   ticket.journeyType === 'round-trip' ? 'Round-trip' : 'Multi-city'}
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Total Passengers</label>
                <p className="text-slate-900 font-medium">{ticket.totalSeats} pax</p>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Group Booking</label>
                <p className="text-slate-900">{ticket.isGroupBooking ? 'Yes' : 'No'}</p>
              </div>

              {isEditing ? (
                <>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Agent</label>
                    <input
                      type="text"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-600 mb-1">메모</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Agent</label>
                    <p className="text-slate-900">{ticket.agentName || '-'}</p>
                  </div>

                  {ticket.notes && (
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">메모</label>
                      <p className="text-slate-900 whitespace-pre-wrap">{ticket.notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom: Passenger Information (Full Width) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm p-6 border border-slate-200"
      >
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Passenger Information ({ticket.passengers.length} pax)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPassengers.length === ticket.passengers.length}
                    onChange={toggleAllPassengers}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">#</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Name</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Gender</th>
                <th className="px-4 py-3 text-center text-slate-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {ticket.passengers.map((passenger, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedPassengers.includes(index)}
                      onChange={() => togglePassengerSelection(index)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-700">{index + 1}</td>
                  <td className="px-4 py-3 text-slate-900 font-medium">
                    {passenger.gender} {passenger.lastName} {passenger.firstName}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{passenger.gender}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleShowPreview(index)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs"
                      >
                        <Eye className="w-3 h-3" />
                        Preview
                      </button>
                      <button
                        onClick={() => handleDownloadIndividualPdf(index)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-xs"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

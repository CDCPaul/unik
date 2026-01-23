'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Upload, Plane, FileText, Loader2, 
  CheckCircle, AlertCircle, Users, MapPin, Plus, Trash2
} from 'lucide-react';
import { parseAirBusanNameList, uploadTicketPdf, createTicket } from '@/lib/services/admin/tickets';
import { extractTextFromPdf, isPdfFile } from '@/lib/utils/pdfParser';
import type { AirlineTicket, TicketPassenger, FlightJourney, ExtraService } from '@unik/shared/types';

export default function NewAirBusanTicketPage() {
  const router = useRouter();
  
  // Airport code to name mapping
  const AIRPORT_MAP: Record<string, string> = {
    'CEB': 'CEBU(MACTAN-CEBU)',
    'PUS': 'BUSAN(GIMHAE)',
    'CJU': 'JEJU'
  };
  
  const AIRPORT_CODES = ['CEB', 'PUS', 'CJU'];
  const TERMINALS = ['1', '2', '3', '4'];
  
  // Helper functions for date conversion
  // Convert "26 FEB 2026" to "2026-02-26"
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

  // Convert "2026-02-26" to "26 FEB 2026"
  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const [year, month, day] = dateStr.split('-');
    const monthName = months[parseInt(month) - 1];
    return `${parseInt(day).toString().padStart(2, '0')} ${monthName} ${year}`;
  };

  // State
  const [nameListFile, setNameListFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  
  // Form data
  const [reservationNumber, setReservationNumber] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [journeyType, setJourneyType] = useState<'one-way' | 'round-trip' | 'multi-city'>('round-trip');
  const [agentName, setAgentName] = useState('Cebu Direct Club Phil. Travel & Tours, Inc.');
  const [notes, setNotes] = useState('');
  const [extraServices, setExtraServices] = useState<ExtraService[]>([
    { name: '', data: '' },
    { name: '', data: '' },
    { name: '', data: '' },
    { name: '', data: '' }
  ]);
  const [passengers, setPassengers] = useState<TicketPassenger[]>([]);
  const [journeys, setJourneys] = useState<FlightJourney[]>([
    {
      flightNumber: '',
      departureAirportCode: '',
      departureAirportName: '',
      departureDate: '',
      departureTime: '00:00',
      departureTerminal: '',
      arrivalAirportCode: '',
      arrivalAirportName: '',
      arrivalDate: '',
      arrivalTime: '00:00',
      arrivalTerminal: '',
      bookingClass: 'Y',
      notValidBefore: '',
      notValidAfter: '',
      baggageAllowance: '15kg'
    }
  ]);

  // Handle namelist file upload and parsing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isPdfFile(file)) {
      alert('Only PDF files can be uploaded.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be 10MB or less.');
      return;
    }

    setNameListFile(file);
    setParseError(null);
    setIsParsing(true);

    try {
      // Extract text from PDF
      const textContent = await extractTextFromPdf(file);
      
      console.log('=== Air Busan Namelist 추출 텍스트 ===');
      console.log(textContent);
      console.log('=== 텍스트 끝 ===');
      
      // Parse namelist to extract passengers
      const parsed = parseAirBusanNameList(textContent);
      
      if (parsed.passengers && parsed.passengers.length > 0) {
        setPassengers(parsed.passengers);
        
        // Auto-fill reservation number if found
        if (parsed.reservationNumber) {
          setReservationNumber(parsed.reservationNumber);
        }
        
        alert(`${parsed.passengers.length} passenger information parsed.${parsed.reservationNumber ? `\nReservation Number: ${parsed.reservationNumber}` : ''}`);
      } else {
        setParseError('No passenger information found.');
      }

    } catch (error) {
      console.error('Parsing error:', error);
      setParseError(error instanceof Error ? error.message : 'Parsing failed.');
    } finally {
      setIsParsing(false);
      e.target.value = '';
    }
  };

  // Handle passenger field change
  const handlePassengerChange = (index: number, field: keyof TicketPassenger, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
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

  // Add journey
  const handleAddJourney = () => {
    setJourneys([...journeys, {
      flightNumber: '',
      departureAirportCode: '',
      departureAirportName: '',
      departureDate: '',
      departureTime: '00:00',
      departureTerminal: '',
      arrivalAirportCode: '',
      arrivalAirportName: '',
      arrivalDate: '',
      arrivalTime: '00:00',
      arrivalTerminal: '',
      bookingClass: 'Y',
      notValidBefore: '',
      notValidAfter: '',
      baggageAllowance: '15kg'
    }]);
  };

  // Remove journey
  const handleRemoveJourney = (index: number) => {
    if (journeys.length <= 1) {
      alert('At least 1 journey is required.');
      return;
    }
    setJourneys(journeys.filter((_, i) => i !== index));
  };

  // Handle save
  const handleSave = async () => {
    if (passengers.length === 0) {
      alert('No passenger information. Please upload the namelist.');
      return;
    }

    if (!reservationNumber) {
      alert('Please enter the reservation number.');
      return;
    }

    if (journeys.length === 0 || !journeys[0].flightNumber) {
      alert('Please enter at least 1 journey information.');
      return;
    }

    setIsSaving(true);

    try {
      // Upload namelist PDF if exists
      let pdfFileUrl = '';
      let pdfFileName = '';
      if (nameListFile) {
        pdfFileUrl = await uploadTicketPdf(nameListFile);
        pdfFileName = nameListFile.name;
      }

      const ticketData: Omit<AirlineTicket, 'id' | 'createdAt' | 'updatedAt'> = {
        airline: 'BX',
        journeyType,
        isGroupBooking: passengers.length > 9,
        totalSeats: passengers.length,
        reservationNumber,
        bookingDate,
        journeys: journeys.filter(j => j.flightNumber), // Only include filled journeys
        passengers,
        extraServices: extraServices.filter(s => s.name.trim() !== ''),
        pdfFileName,
        pdfFileUrl,
        agentName,
        notes,
        needsPassengerInput: false
      };

      const ticketId = await createTicket(ticketData);
      alert('Ticket created successfully!');
      router.push(`/admin/tickets/airbusan/${ticketId}`);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save ticket.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link 
              href="/admin/tickets/new"
              className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block"
            >
              ← Back to Airline Selection
            </Link>
            <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-3">
              <Plane className="w-10 h-10 text-blue-600" />
              Create Air Busan Ticket
            </h1>
            <p className="text-slate-600 mt-2">Upload namelist file and enter journey information</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - File Upload & Basic Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* File Upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200"
            >
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Upload Namelist File
              </h2>

              <label className="block">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-50 hover:bg-blue-50">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 mb-2">
                    Select PDF namelist file
                  </p>
                  <p className="text-xs text-slate-400">Max 10MB</p>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={isParsing}
                  className="hidden"
                />
              </label>

              {nameListFile && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">{nameListFile.name}</p>
                  <p className="text-xs text-blue-600 mt-1">{(nameListFile.size / 1024).toFixed(1)} KB</p>
                </div>
              )}

              {isParsing && (
                <div className="mt-4 flex items-center gap-2 text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Parsing namelist...</span>
                </div>
              )}

              {parseError && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{parseError}</p>
                </div>
              )}

              {passengers.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-800 font-medium">Parsing Complete!</p>
                    <p className="text-xs text-green-700 mt-1">{passengers.length} passenger information</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Basic Booking Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200"
            >
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Booking Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Reservation Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reservationNumber}
                    onChange={(e) => setReservationNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                    placeholder="e.g., E8TX89"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Booking Date
                  </label>
                  <input
                    type="text"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                    placeholder="e.g., 27 NOV 2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Journey Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={journeyType}
                    onChange={(e) => setJourneyType(e.target.value as any)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                  >
                    <option value="one-way">One-way</option>
                    <option value="round-trip">Round-trip</option>
                    <option value="multi-city">Multi-city</option>
                  </select>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Panel - Journey & Passenger Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Journey Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Journey Information (Manual Entry)
                </h2>
                <button
                  onClick={handleAddJourney}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Journey
                </button>
              </div>

              <div className="space-y-6">
                {journeys.map((journey, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-slate-700">Journey {index + 1}</h3>
                      {journeys.length > 1 && (
                        <button
                          onClick={() => handleRemoveJourney(index)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Flight Number
                        </label>
                        <input
                          type="text"
                          value={journey.flightNumber}
                          onChange={(e) => handleJourneyChange(index, 'flightNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                          placeholder="e.g., BX712"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Departure Airport Code
                        </label>
                        <select
                          value={journey.departureAirportCode}
                          onChange={(e) => handleJourneyChange(index, 'departureAirportCode', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                        >
                          <option value="">Select</option>
                          {AIRPORT_CODES.map(code => (
                            <option key={code} value={code}>{code}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Departure Airport Name
                        </label>
                        <input
                          type="text"
                          value={journey.departureAirportName}
                          readOnly
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-slate-50"
                          placeholder="Select airport code"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Departure Date
                        </label>
                        <input
                          type="date"
                          value={journey.departureDate ? convertToDateInput(journey.departureDate) : ''}
                          onChange={(e) => handleJourneyChange(index, 'departureDate', formatDateForDisplay(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Departure Time
                        </label>
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
                                {i.toString().padStart(2, '0')}h
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
                              return <option key={i} value={min}>{min}m</option>;
                            })}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Departure Terminal
                        </label>
                        <select
                          value={journey.departureTerminal}
                          onChange={(e) => handleJourneyChange(index, 'departureTerminal', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                        >
                          <option value="">Select</option>
                          {TERMINALS.map(terminal => (
                            <option key={terminal} value={terminal}>{terminal}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Arrival Airport Code
                        </label>
                        <select
                          value={journey.arrivalAirportCode}
                          onChange={(e) => handleJourneyChange(index, 'arrivalAirportCode', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                        >
                          <option value="">Select</option>
                          {AIRPORT_CODES.map(code => (
                            <option key={code} value={code}>{code}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Arrival Airport Name
                        </label>
                        <input
                          type="text"
                          value={journey.arrivalAirportName}
                          readOnly
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-slate-50"
                          placeholder="Select airport code"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Arrival Date
                        </label>
                        <input
                          type="date"
                          value={journey.arrivalDate ? convertToDateInput(journey.arrivalDate) : ''}
                          onChange={(e) => handleJourneyChange(index, 'arrivalDate', formatDateForDisplay(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Arrival Time
                        </label>
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
                                {i.toString().padStart(2, '0')}h
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
                              return <option key={i} value={min}>{min}m</option>;
                            })}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Arrival Terminal
                        </label>
                        <select
                          value={journey.arrivalTerminal}
                          onChange={(e) => handleJourneyChange(index, 'arrivalTerminal', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                        >
                          <option value="">Select</option>
                          {TERMINALS.map(terminal => (
                            <option key={terminal} value={terminal}>{terminal}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Baggage
                        </label>
                        <input
                          type="text"
                          value={journey.baggageAllowance}
                          onChange={(e) => handleJourneyChange(index, 'baggageAllowance', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                          placeholder="e.g., 15kg"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Passenger Information */}
            {passengers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200"
              >
                <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Passenger Information ({passengers.length} pax)
                </h2>

                <div className="space-y-4">
                  {passengers.map((passenger, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-center">
                        <div className="text-base text-center text-slate-700">
                          {index + 1}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={passenger.lastName || ''}
                          onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                        <input
                          type="text"
                          value={passenger.firstName || ''}
                          onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                        <select
                          value={passenger.gender || 'Mr'}
                          onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                        >
                          <option value="Mr">Mr</option>
                          <option value="Ms">Ms</option>
                          <option value="Mstr">Mstr</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                        <select
                          value={passenger.type || 'Adult'}
                          onChange={(e) => handlePassengerChange(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                        >
                          <option value="Adult">Adult</option>
                          <option value="Child">Child</option>
                          <option value="Infant">Infant</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex justify-end gap-4"
        >
          <Link
            href="/admin/tickets/new"
            className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving || passengers.length === 0 || !reservationNumber}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Create Ticket
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}


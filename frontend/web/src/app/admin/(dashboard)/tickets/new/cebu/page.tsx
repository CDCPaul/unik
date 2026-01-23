'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Upload, Plane, FileText, Loader2, 
  CheckCircle, AlertCircle, Users, MapPin
} from 'lucide-react';
import { parseCebuPacificPdf, uploadTicketPdf, createTicket } from '@/lib/services/admin/tickets';
import { extractTextFromPdf, isPdfFile } from '@/lib/utils/pdfParser';
import type { AirlineTicket, TicketPassenger, ExtraService } from '@unik/shared/types';

export default function NewCebuPacificTicketPage() {
  const router = useRouter();
  
  // State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedData, setParsedData] = useState<Partial<AirlineTicket> | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  
  // Form data
  const [agentName, setAgentName] = useState('Cebu Direct Club Phil. Travel & Tours, Inc.');
  const [notes, setNotes] = useState('');
  const [extraServices, setExtraServices] = useState<ExtraService[]>([
    { name: '', data: '' },
    { name: '', data: '' },
    { name: '', data: '' },
    { name: '', data: '' }
  ]);
  const [passengers, setPassengers] = useState<TicketPassenger[]>([]);

  // Handle PDF file upload and parsing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isPdfFile(file)) {
      alert('Only PDF files are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB.');
      return;
    }

    setPdfFile(file);
    setParseError(null);
    setIsParsing(true);
    setIsUploading(true);

    try {
      // 1. Upload to Firebase Storage
      const pdfFileUrl = await uploadTicketPdf(file);
      setIsUploading(false);

      // 2. Extract text from PDF
      const textContent = await extractTextFromPdf(file);
      
      console.log('=== Cebu Pacific PDF 추출 텍스트 ===');
      console.log(textContent);
      console.log('=== 텍스트 끝 ===');
      
      // 3. Parse text content
      const parsed = parseCebuPacificPdf(textContent);
      
      setParsedData({
        ...parsed,
        pdfFileName: file.name,
        pdfFileUrl,
        agentName,
        notes,
        extraServices
      });

      // Set passengers if parsed
      if (parsed.passengers && parsed.passengers.length > 0) {
        setPassengers(parsed.passengers);
      }

    } catch (error) {
      console.error('Parsing error:', error);
      setParseError(error instanceof Error ? error.message : 'Parsing failed.');
    } finally {
      setIsParsing(false);
      e.target.value = '';
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!parsedData) {
      alert('No parsed data available.');
      return;
    }

    if (!agentName.trim()) {
      alert('Please enter the Agent Name.');
      return;
    }

    if (!notes.trim()) {
      alert('Please enter Notes.');
      return;
    }

    setIsSaving(true);

    try {
      const ticketData: Omit<AirlineTicket, 'id' | 'createdAt' | 'updatedAt'> = {
        airline: '5J',
        journeyType: parsedData.journeyType || 'one-way',
        isGroupBooking: parsedData.isGroupBooking || false,
        totalSeats: parsedData.totalSeats || passengers.length,
        reservationNumber: parsedData.reservationNumber || '',
        bookingDate: parsedData.bookingDate || '',
        journeys: parsedData.journeys || [],
        passengers: passengers,
        extraServices: extraServices.filter(s => s.name.trim() !== ''),
        pdfFileName: parsedData.pdfFileName || '',
        pdfFileUrl: parsedData.pdfFileUrl || '',
        agentName,
        notes,
        needsPassengerInput: false
      };

      const ticketId = await createTicket(ticketData);
      alert('Ticket created successfully!');
      router.push(`/admin/tickets/cebu/${ticketId}`);
    } catch (error) {
      console.error('Save error:', error);
      alert('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/tickets"
            className="text-sm text-slate-600 hover:text-slate-900 mb-4 inline-flex items-center"
          >
            ← Back to Ticket List
          </Link>
          
          <div className="flex items-center gap-3 mt-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Plane className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Register Cebu Pacific Ticket
              </h1>
              <p className="text-slate-600 mt-1">
                Upload Itinerary Receipt PDF
              </p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Upload className="w-5 h-5 text-slate-700" />
            <h2 className="text-xl font-semibold text-slate-900">
              PDF Upload
            </h2>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-orange-400 transition-colors">
            <input
              type="file"
              id="pdf-upload"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isParsing || isUploading}
            />
            <label
              htmlFor="pdf-upload"
              className={`cursor-pointer ${isParsing || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isParsing || isUploading ? (
                <Loader2 className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-spin" />
              ) : (
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              )}
              
              <p className="text-lg font-medium text-slate-700 mb-2">
                {isParsing ? 'Parsing...' : isUploading ? 'Uploading...' : 'Select PDF file'}
              </p>
              <p className="text-sm text-slate-500">
                {pdfFile ? pdfFile.name : 'Max 10MB'}
              </p>
            </label>
          </div>

          {parseError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Parsing Error</p>
                <p className="text-sm text-red-700 mt-1">{parseError}</p>
              </div>
            </div>
          )}

          {parsedData && !parseError && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Parsing Complete!</p>
                <p className="text-sm text-green-700 mt-1">
                  Reservation: {parsedData.reservationNumber} | 
                  Journey: {parsedData.journeyType === 'round-trip' ? 'Round-trip' : 'One-way'} | 
                  Passengers: {passengers.length} pax
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Parsed Data Display */}
        {parsedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Journey Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 text-slate-700" />
                <h2 className="text-xl font-semibold text-slate-900">Journey Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Reservation Number
                  </label>
                  <input
                    type="text"
                    value={parsedData.reservationNumber || ''}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Booking Date
                  </label>
                  <input
                    type="text"
                    value={parsedData.bookingDate || ''}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Journey Type
                  </label>
                  <input
                    type="text"
                    value={parsedData.journeyType === 'round-trip' ? 'Round-trip' : 'One-way'}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Total Passengers
                  </label>
                  <input
                    type="text"
                    value={parsedData.totalSeats || passengers.length}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              {/* Journeys */}
              <div className="mt-8 space-y-4">
                {parsedData.journeys?.map((journey, index) => (
                  <div key={index} className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                    <h3 className="font-semibold text-slate-900 mb-4">
                      {index === 0 ? 'Outbound' : 'Inbound'}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Flight</p>
                        <p className="font-medium text-slate-900">{journey.flightNumber}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Departure</p>
                        <p className="font-medium text-slate-900">
                          {journey.departureAirportCode}
                        </p>
                        <p className="text-xs text-slate-600">
                          {journey.departureDate} {journey.departureTime}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Arrival</p>
                        <p className="font-medium text-slate-900">
                          {journey.arrivalAirportCode}
                        </p>
                        <p className="text-xs text-slate-600">
                          {journey.arrivalDate} {journey.arrivalTime}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Baggage</p>
                        <p className="font-medium text-slate-900">{journey.baggageAllowance}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Passengers */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-slate-700" />
                <h2 className="text-xl font-semibold text-slate-900">
                  Passenger Information ({passengers.length} pax)
                </h2>
              </div>

              <div className="space-y-4">
                {passengers.map((passenger, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-center">
                      <span className="text-base text-slate-700">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={passenger.lastName || ''}
                        onChange={(e) => {
                          const newPassengers = [...passengers];
                          newPassengers[index].lastName = e.target.value;
                          setPassengers(newPassengers);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={passenger.firstName || ''}
                        onChange={(e) => {
                          const newPassengers = [...passengers];
                          newPassengers[index].firstName = e.target.value;
                          setPassengers(newPassengers);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Gender
                      </label>
                      <select
                        value={passenger.gender || ''}
                        onChange={(e) => {
                          const newPassengers = [...passengers];
                          newPassengers[index].gender = e.target.value as any;
                          setPassengers(newPassengers);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                      >
                        <option value="">Select</option>
                        <option value="Mr">Mr</option>
                        <option value="Ms">Ms</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Miss">Miss</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Type
                      </label>
                      <input
                        type="text"
                        value={passenger.passengerType || ''}
                        disabled
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-100 text-slate-900"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Extra Services */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">
                Extra Services
              </h2>

              <div className="space-y-4">
                {extraServices.map((service, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Service Name (Optional)"
                      value={service.name}
                      onChange={(e) => {
                        const newServices = [...extraServices];
                        newServices[index].name = e.target.value;
                        setExtraServices(newServices);
                      }}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="Details (Optional)"
                      value={service.data}
                      onChange={(e) => {
                        const newServices = [...extraServices];
                        newServices[index].data = e.target.value;
                        setExtraServices(newServices);
                      }}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Agent & Notes */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">
                Additional Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes *
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Link
                href="/admin/tickets"
                className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={isSaving || !parsedData}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Save
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

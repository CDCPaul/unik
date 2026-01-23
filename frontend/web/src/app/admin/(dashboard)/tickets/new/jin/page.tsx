'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Upload, Plane, FileText, Loader2, 
  CheckCircle, AlertCircle, UserPlus, Trash2, Save
} from 'lucide-react';
import type { AirlineTicket, TicketPassenger, ExtraService, FareInformation, CurrencyType, PaymentMethodType } from '@unik/shared/types';
import { parseJinAirHtml } from '@/lib/services/admin/tickets';
import { createTicket, uploadTicketPdf } from '@/lib/services/admin';

export default function NewJinAirTicketPage() {
  const router = useRouter();
  
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState<Partial<AirlineTicket> | null>(null);
  
  // Form states
  const [passengers, setPassengers] = useState<TicketPassenger[]>([]);
  const [extraServices, setExtraServices] = useState<ExtraService[]>([
    { name: '', data: '' },
    { name: '', data: '' },
    { name: '', data: '' },
    { name: '', data: '' }
  ]);
  const [agentName, setAgentName] = useState('Cebu Direct Club Phil. Travel & Tours, Inc.');
  const [notes, setNotes] = useState('');
  const [fareInfo, setFareInfo] = useState<FareInformation>({});

  // Debug: Watch passengers state changes
  useEffect(() => {
    console.log('🎯 Passengers state updated:', passengers.length, 'passengers');
    console.log('Passengers:', passengers);
  }, [passengers]);

  // Helper to check if file is HTML
  const isHtmlFile = (file: File) => {
    return file.type === 'text/html' || file.name.endsWith('.html') || file.name.endsWith('.htm');
  };

  // Extract text from HTML file
  const extractTextFromHtml = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      reader.onerror = () => reject(new Error('Failed to read HTML file'));
      reader.readAsText(file);
    });
  };

  // Handle HTML file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isHtmlFile(file)) {
      alert('Only HTML files are allowed.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB.');
      return;
    }

    setHtmlFile(file);
    setIsUploading(true);

    try {
      // 1. Extract text from HTML
      const htmlContent = await extractTextFromHtml(file);
      
      console.log('=== e-Ticket HTML 추출 텍스트 ===');
      console.log(htmlContent.substring(0, 1000)); // Log first 1000 chars
      console.log('=== 텍스트 끝 ===');

      // 2. Parse HTML
      const parsed = parseJinAirHtml(htmlContent);
      setParsedData(parsed);

      console.log('=== 파싱 완료 ===');
      console.log('Journey Type:', parsed.journeyType);
      console.log('Journeys:', parsed.journeys);
      console.log('Passengers:', parsed.passengers);
      console.log('Passenger count:', parsed.passengers?.length);

      // 3. Set form states
      const passengersList = parsed.passengers || [];
      console.log('✅ Setting passengers to state:', passengersList.length, 'passengers');
      setPassengers(passengersList);
      
      setExtraServices(parsed.extraServices || [
        { name: '', data: '' },
        { name: '', data: '' },
        { name: '', data: '' },
        { name: '', data: '' }
      ]);
      setAgentName(parsed.agentName || 'Cebu Direct Club Phil. Travel & Tours, Inc.');

      console.log('=== State 설정 완료 ===');

    } catch (error) {
      console.error('Parsing error:', error);
      alert(error instanceof Error ? error.message : 'HTML 파싱에 실패했습니다.');
      setHtmlFile(null);
      setParsedData(null);
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  // Handle passenger data change
  const handlePassengerChange = (index: number, field: keyof TicketPassenger, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  // Add passenger
  const handleAddPassenger = () => {
    setPassengers([...passengers, { 
      lastName: '', 
      firstName: '', 
      gender: '', 
      ticketNumber: '',
      passengerType: 'Adult'
    }]);
  };

  // Remove passenger
  const handleRemovePassenger = (index: number) => {
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  // Handle extra service change
  const handleExtraServiceChange = (index: number, field: 'name' | 'data', value: string) => {
    const updated = [...extraServices];
    updated[index] = { ...updated[index], [field]: value };
    setExtraServices(updated);
  };

  // Handle save
  const handleSave = async () => {
    if (!parsedData || !htmlFile) {
      alert('Please upload an HTML file first.');
      return;
    }

    if (!parsedData.reservationNumber) {
      alert('Reservation number is missing.');
      return;
    }

    if (passengers.length === 0) {
      alert('At least one passenger is required.');
      return;
    }

    // Validate passenger data
    for (const p of passengers) {
      if (!p.lastName || !p.firstName) {
        alert('Please enter both last and first name for all passengers.');
        return;
      }
    }

    // Validate required fields
    if (!agentName.trim()) {
      alert('Please enter agent name.');
      return;
    }

    if (!notes.trim()) {
      alert('Please enter notes.');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload HTML file to Firebase Storage
      console.log('📤 Uploading HTML file to storage...');
      const pdfFileUrl = await uploadTicketPdf(htmlFile);

      // 2. Prepare ticket data
      const ticketData: Partial<AirlineTicket> = {
        ...parsedData,
        agentName,
        notes: notes.trim(),
        passengers,
        extraServices: extraServices.filter(s => s.name || s.data),
        needsPassengerInput: false,
        pdfFileUrl
      };

      // Only add fareInformation if at least one field is filled
      const hasFareInfo = fareInfo.formOfPayment || 
        fareInfo.fareAmount?.value || 
        fareInfo.fuelSurcharge?.value || 
        fareInfo.tax?.value || 
        fareInfo.changeFee?.value || 
        fareInfo.totalAmount?.value;
      
      if (hasFareInfo) {
        ticketData.fareInformation = fareInfo;
      }

      console.log('💾 Creating ticket in Firestore...');
      const ticketId = await createTicket(ticketData as Omit<AirlineTicket, 'id' | 'createdAt' | 'updatedAt'>);

      console.log('✅ Ticket created successfully:', ticketId);
      alert('Ticket created successfully!');
      router.push(`/admin/tickets/${ticketId}`);

    } catch (error) {
      console.error('Save error:', error);
      alert(error instanceof Error ? error.message : 'Failed to create ticket.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin/tickets/new" className="text-slate-500 hover:text-slate-700">
            ← Select Airline
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-lg">
            <Plane className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create JIN Air Ticket</h1>
            <p className="text-slate-500">Upload e-Ticket HTML file</p>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="admin-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">📄 Upload HTML File</h2>
        <div className="relative">
          <input
            type="file"
            accept=".html,.htm,text/html"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="htmlFile"
          />
          <label
            htmlFor="htmlFile"
            className={`
              flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors
              ${htmlFile ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-sm text-blue-600">Parsing...</span>
              </>
            ) : htmlFile ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-600">{htmlFile.name}</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-slate-600" />
                <span className="text-sm text-slate-600">Select JIN Air e-Ticket HTML file</span>
              </>
            )}
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          💡 JIN Air provides Travel Plans in HTML format. (Max 10MB)
        </p>
      </div>

      {/* Parsed Data Display */}
      {parsedData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Basic Info */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">📋 Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reservation Number</label>
                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded">
                  {parsedData.reservationNumber || '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Booking Date</label>
                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded">
                  {parsedData.bookingDate || '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Journey Type</label>
                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded">
                  {parsedData.journeyType === 'round-trip' ? 'Round-trip' : 'One-way'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Passengers</label>
                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded">
                  {parsedData.totalSeats || 0} pax {parsedData.isGroupBooking && '(Group)'}
                </p>
              </div>
            </div>
          </div>

          {/* Journey Info */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">✈️ Journey Information</h2>
            {parsedData.journeys && parsedData.journeys.map((journey, index) => (
              <div key={index} className="mb-6 last:mb-0">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  {index === 0 ? 'Outbound' : 'Inbound'}
                </h3>
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Flight</label>
                    <p className="text-sm text-slate-900">{journey.flightNumber || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Departure</label>
                    <p className="text-sm text-slate-900">
                      {journey.departureAirportCode} ({journey.departureAirportName || '-'})
                      {journey.departureTerminal && ` T${journey.departureTerminal}`}
                    </p>
                    <p className="text-xs text-slate-600">
                      {journey.departureDate} {journey.departureTime}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Arrival</label>
                    <p className="text-sm text-slate-900">
                      {journey.arrivalAirportCode} ({journey.arrivalAirportName || '-'})
                      {journey.arrivalTerminal && ` T${journey.arrivalTerminal}`}
                    </p>
                    <p className="text-xs text-slate-600">
                      {journey.arrivalDate} {journey.arrivalTime}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Booking Class</label>
                    <p className="text-sm text-slate-900">{journey.bookingClass || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Baggage</label>
                    <p className="text-sm text-slate-900">{journey.baggageAllowance || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Validity</label>
                    <p className="text-xs text-slate-600">
                      Before: {journey.notValidBefore || '-'}<br />
                      After: {journey.notValidAfter || '-'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Passengers */}
          <div className="admin-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                👥 Passenger Information ({passengers.length} pax)
              </h2>
              <button
                onClick={handleAddPassenger}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Add Passenger
              </button>
            </div>
            {passengers.length === 0 ? (
              <p className="text-sm text-slate-500">No passenger information.</p>
            ) : (
              <div className="space-y-4">
                {passengers.map((passenger, index) => {
                  console.log(`👤 승객 ${index + 1} 렌더링:`, {
                    lastName: passenger.lastName,
                    firstName: passenger.firstName,
                    gender: passenger.gender,
                    ticketNumber: passenger.ticketNumber,
                    passengerType: passenger.passengerType
                  });
                  return (
                <div key={index} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-700">Passenger {index + 1}</h3>
                    {passengers.length > 1 && (
                      <button
                        onClick={() => handleRemovePassenger(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Last Name</label>
                      <input
                        type="text"
                        placeholder="e.g. KIM"
                        value={passenger.lastName || ''}
                        onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">First Name</label>
                      <input
                        type="text"
                        placeholder="e.g. SANGSOO"
                        value={passenger.firstName || ''}
                        onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
                      <select
                        value={passenger.gender || ''}
                        onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select</option>
                        <option value="Mr">Mr</option>
                        <option value="Ms">Ms</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Miss">Miss</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Ticket Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 7182382130230"
                        value={passenger.ticketNumber || ''}
                        onChange={(e) => handlePassengerChange(index, 'ticketNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
                  );
                })}
            </div>
            )}
          </div>

          {/* Extra Services */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">🎒 Extra Services (Max 4)</h2>
            <div className="space-y-3">
              {extraServices.map((service, index) => (
                <div key={index} className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="서비스 이름 (예: 기내식)"
                    value={service.name}
                    onChange={(e) => handleExtraServiceChange(index, 'name', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="세부 정보 (예: 한식)"
                    value={service.data}
                    onChange={(e) => handleExtraServiceChange(index, 'data', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Agent & Notes */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">📝 Additional Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Agent Name</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter additional notes or special requests..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Fare Information */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">💰 Fare Information (Optional)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                <select
                  value={fareInfo.formOfPayment || ''}
                  onChange={(e) => setFareInfo({ ...fareInfo, formOfPayment: e.target.value as PaymentMethodType || undefined })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Not selected</option>
                  <option value="CASH">CASH</option>
                  <option value="CREDIT_CARD">CREDIT CARD</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fare Amount</label>
                  <div className="flex gap-2">
                    <select
                      value={fareInfo.fareAmount?.currency || 'PHP'}
                      onChange={(e) => setFareInfo({ 
                        ...fareInfo, 
                        fareAmount: fareInfo.fareAmount?.value 
                          ? { currency: e.target.value as CurrencyType, value: fareInfo.fareAmount.value }
                          : undefined
                      })}
                      className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="PHP">PHP</option>
                      <option value="USD">USD</option>
                      <option value="KRW">KRW</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Amount"
                      value={fareInfo.fareAmount?.value || ''}
                      onChange={(e) => setFareInfo({ 
                        ...fareInfo, 
                        fareAmount: e.target.value 
                          ? { currency: fareInfo.fareAmount?.currency || 'PHP', value: e.target.value }
                          : undefined
                      })}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fuel Surcharge</label>
                  <div className="flex gap-2">
                    <select
                      value={fareInfo.fuelSurcharge?.currency || 'PHP'}
                      onChange={(e) => setFareInfo({ 
                        ...fareInfo, 
                        fuelSurcharge: fareInfo.fuelSurcharge?.value 
                          ? { currency: e.target.value as CurrencyType, value: fareInfo.fuelSurcharge.value }
                          : undefined
                      })}
                      className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="PHP">PHP</option>
                      <option value="USD">USD</option>
                      <option value="KRW">KRW</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Amount"
                      value={fareInfo.fuelSurcharge?.value || ''}
                      onChange={(e) => setFareInfo({ 
                        ...fareInfo, 
                        fuelSurcharge: e.target.value 
                          ? { currency: fareInfo.fuelSurcharge?.currency || 'PHP', value: e.target.value }
                          : undefined
                      })}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tax</label>
                  <div className="flex gap-2">
                    <select
                      value={fareInfo.tax?.currency || 'PHP'}
                      onChange={(e) => setFareInfo({ 
                        ...fareInfo, 
                        tax: fareInfo.tax?.value 
                          ? { currency: e.target.value as CurrencyType, value: fareInfo.tax.value }
                          : undefined
                      })}
                      className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="PHP">PHP</option>
                      <option value="USD">USD</option>
                      <option value="KRW">KRW</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Amount"
                      value={fareInfo.tax?.value || ''}
                      onChange={(e) => setFareInfo({ 
                        ...fareInfo, 
                        tax: e.target.value 
                          ? { currency: fareInfo.tax?.currency || 'PHP', value: e.target.value }
                          : undefined
                      })}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Change Fee</label>
                  <div className="flex gap-2">
                    <select
                      value={fareInfo.changeFee?.currency || 'PHP'}
                      onChange={(e) => setFareInfo({ 
                        ...fareInfo, 
                        changeFee: fareInfo.changeFee?.value 
                          ? { currency: e.target.value as CurrencyType, value: fareInfo.changeFee.value }
                          : undefined
                      })}
                      className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="PHP">PHP</option>
                      <option value="USD">USD</option>
                      <option value="KRW">KRW</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Amount"
                      value={fareInfo.changeFee?.value || ''}
                      onChange={(e) => setFareInfo({ 
                        ...fareInfo, 
                        changeFee: e.target.value 
                          ? { currency: fareInfo.changeFee?.currency || 'PHP', value: e.target.value }
                          : undefined
                      })}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount</label>
                <div className="flex gap-2">
                  <select
                    value={fareInfo.totalAmount?.currency || 'PHP'}
                    onChange={(e) => setFareInfo({ 
                      ...fareInfo, 
                      totalAmount: fareInfo.totalAmount?.value 
                        ? { currency: e.target.value as CurrencyType, value: fareInfo.totalAmount.value }
                        : undefined
                    })}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="PHP">PHP</option>
                    <option value="USD">USD</option>
                    <option value="KRW">KRW</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Amount"
                    value={fareInfo.totalAmount?.value || ''}
                    onChange={(e) => setFareInfo({ 
                      ...fareInfo, 
                      totalAmount: e.target.value 
                        ? { currency: fareInfo.totalAmount?.currency || 'PHP', value: e.target.value }
                        : undefined
                    })}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-500">
                💡 Fields left blank will not appear on the ticket.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Link
              href="/admin/tickets/new"
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={isUploading}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Ticket
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

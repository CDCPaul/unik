'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Upload, Plane, FileText, Loader2, 
  CheckCircle, AlertCircle, Users, MapPin
} from 'lucide-react';
import { parseJejuAirPdf, uploadTicketPdf, createTicket } from '@/lib/services/admin/tickets';
import { extractTextFromPdf, isPdfFile } from '@/lib/utils/pdfParser';
import { parseJejuAirNameList, mergePassengerData } from '@/lib/utils/nameListParser';
import type { AirlineTicket, TicketPassenger, ExtraService, FareInformation, CurrencyType, PaymentMethodType } from '@unik/shared/types';

export default function NewJejuTicketPage() {
  const router = useRouter();
  
  // State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [nameListFile, setNameListFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingNameList, setIsUploadingNameList] = useState(false);
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
  const [fareInfo, setFareInfo] = useState<FareInformation>({});

  // Handle e-Ticket PDF file upload and parsing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isPdfFile(file)) {
      alert('Only PDF files are allowed.');
      return;
    }

    // Validate file size (max 10MB)
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
      
      // 🔍 디버깅: 추출된 텍스트 확인
      console.log('=== e-Ticket PDF 추출 텍스트 ===');
      console.log(textContent);
      console.log('=== 텍스트 끝 ===');
      
      // 3. Parse text content
      const parsed = parseJejuAirPdf(textContent);
      
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
      setParseError(error instanceof Error ? error.message : 'Failed to parse PDF.');
    } finally {
      setIsParsing(false);
      e.target.value = '';
    }
  };

  // Handle Name List PDF upload and parsing
  const handleNameListUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isPdfFile(file)) {
      alert('Only PDF files are allowed.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB.');
      return;
    }

    setNameListFile(file);
    setIsUploadingNameList(true);

    try {
      // 1. Upload to Firebase Storage
      const nameListFileUrl = await uploadTicketPdf(file);
      
      // 2. Extract text from PDF
      const textContent = await extractTextFromPdf(file);
      
      console.log('=== Name List PDF 추출 텍스트 ===');
      console.log(textContent);
      console.log('=== 텍스트 끝 ===');
      
      // 3. Parse Name List
      const nameListResult = parseJejuAirNameList(textContent);
      
      console.log('=== Name List 파싱 결과 ===');
      console.log(nameListResult);
      
      // 4. Merge with existing passengers
      if (parsedData && parsedData.reservationNumber) {
        const mergedPassengers = mergePassengerData(
          passengers,
          nameListResult.passengers  // ✅ passengers 배열만 전달
        );
        
        console.log('=== 병합된 승객 데이터 ===');
        console.log(mergedPassengers);
        
        setPassengers(mergedPassengers);
        
        // Update parsedData with name list info
        setParsedData({
          ...parsedData,
          passengers: mergedPassengers,
          nameListFileName: file.name,
          nameListFileUrl,
          needsPassengerInput: mergedPassengers.length === 0
        });
      }

    } catch (error) {
      console.error('Name List parsing error:', error);
      alert(error instanceof Error ? error.message : 'Failed to parse Name List.');
    } finally {
      setIsUploadingNameList(false);
      e.target.value = '';
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

  // Handle save
  const handleSave = async () => {
    if (!parsedData) {
      alert('No parsed data available.');
      return;
    }

    // Validation
    if (passengers.length === 0) {
      alert('At least one passenger is required.');
      return;
    }

    // Validate required fields
    if (!agentName.trim()) {
      alert('Please enter Agent Name.');
      return;
    }

    if (!notes.trim()) {
      alert('Please enter Notes.');
      return;
    }

    setIsSaving(true);

    try {
      // Build ticket data, excluding undefined values
      const ticketData: Partial<AirlineTicket> = {
        ...parsedData,
        agentName,
        notes: notes.trim(),
        passengers,
        extraServices: extraServices.filter(s => s.name || s.data),
        needsPassengerInput: false
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

      const ticketId = await createTicket(ticketData as AirlineTicket);
      
      alert('Ticket created successfully!');
      router.push(`/admin/tickets/${ticketId}`);

    } catch (error) {
      console.error('Save error:', error);
      alert(error instanceof Error ? error.message : 'Failed to save ticket.');
    } finally {
      setIsSaving(false);
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
          <div className="w-12 h-12 flex items-center justify-center bg-orange-100 rounded-lg">
            <Plane className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create JEJU Air Ticket</h1>
            <p className="text-slate-500">Upload e-Ticket PDF file</p>
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="admin-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">📄 File Upload</h2>
        
        {/* e-Ticket PDF */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              e-Ticket PDF <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={isParsing || isUploading}
                className="hidden"
                id="eTicketFile"
              />
              <label
                htmlFor="eTicketFile"
                className={`
                  flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                  ${pdfFile ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}
                  ${(isParsing || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-600">Uploading...</span>
                  </>
                ) : isParsing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
                    <span className="text-sm text-orange-600">Parsing...</span>
                  </>
                ) : pdfFile ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-600">{pdfFile.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-slate-600" />
                    <span className="text-sm text-slate-600">Click to select e-Ticket PDF</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Name List PDF (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Name List PDF <span className="text-slate-400">(Optional - for group tickets)</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf"
                onChange={handleNameListUpload}
                disabled={!pdfFile || isUploadingNameList}
                className="hidden"
                id="nameListFile"
              />
              <label
                htmlFor="nameListFile"
                className={`
                  flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                  ${nameListFile ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}
                  ${(!pdfFile || isUploadingNameList) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isUploadingNameList ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-600">Uploading...</span>
                  </>
                ) : nameListFile ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-600">{nameListFile.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-slate-600" />
                    <span className="text-sm text-slate-600">Click to select Name List PDF</span>
                  </>
                )}
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              * Upload if gender and Adult/Child information is missing in group tickets
            </p>
          </div>
        </div>

        {/* Parse Error */}
        {parseError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Parsing Error</p>
              <p className="text-sm text-red-700 mt-1">{parseError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Parsed Data Display */}
      {parsedData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Booking Info */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">📋 Reservation Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reservation Number</label>
                <p className="text-sm text-slate-900 font-mono bg-slate-50 px-3 py-2 rounded">
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Group Booking</label>
                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded">
                  {parsedData.isGroupBooking ? `Yes (${parsedData.totalSeats} seats)` : 'No'}
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
                      {journey.departureAirportCode || '-'}
                      {journey.departureAirportName && ` (${journey.departureAirportName})`}
                      {journey.departureTerminal && ` T${journey.departureTerminal}`}
                    </p>
                    <p className="text-xs text-slate-600">
                      {journey.departureDate} {journey.departureTime}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Arrival</label>
                    <p className="text-sm text-slate-900">
                      {journey.arrivalAirportCode || '-'}
                      {journey.arrivalAirportName && ` (${journey.arrivalAirportName})`}
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
                    <label className="block text-xs font-medium text-slate-600 mb-1">Seats</label>
                    <p className="text-sm text-slate-900">{(journey as any).seats || '-'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Agent & Notes */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">📝 Additional Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Agent Name</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="admin-input"
                  placeholder="Cebu Direct Club"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="admin-input"
                  rows={3}
                  placeholder="Enter additional notes"
                  required
                />
              </div>
            </div>
          </div>

          {/* Extra Services */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">🎫 Extra Services (Max 4)</h2>
            <div className="space-y-3">
              {extraServices.map((service, index) => (
                <div key={index} className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={service.name}
                    onChange={(e) => {
                      const updated = [...extraServices];
                      updated[index].name = e.target.value;
                      setExtraServices(updated);
                    }}
                    className="admin-input"
                    placeholder={`Service ${index + 1} Name`}
                  />
                  <input
                    type="text"
                    value={service.data}
                    onChange={(e) => {
                      const updated = [...extraServices];
                      updated[index].data = e.target.value;
                      setExtraServices(updated);
                    }}
                    className="admin-input"
                    placeholder={`Service ${index + 1} Details`}
                  />
                </div>
              ))}
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
                  className="admin-input"
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
                      className="w-24 admin-input"
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
                      className="flex-1 admin-input"
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
                      className="w-24 admin-input"
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
                      className="flex-1 admin-input"
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
                      className="w-24 admin-input"
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
                      className="flex-1 admin-input"
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
                      className="w-24 admin-input"
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
                      className="flex-1 admin-input"
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
                    className="w-24 admin-input"
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
                    className="flex-1 admin-input"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-500">
                💡 Fields left blank will not appear on the ticket.
              </p>
            </div>
          </div>

          {/* Passengers */}
          <div className="admin-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Passenger Information ({passengers.length} pax)
              </h2>
              <button
                onClick={handleAddPassenger}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Passenger
              </button>
            </div>

            {passengers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No passenger information. Please add manually.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {passengers.map((passenger, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-700">Passenger {index + 1}</span>
                      <button
                        onClick={() => handleRemovePassenger(index)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <input
                        type="text"
                        value={passenger.lastName}
                        onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)}
                        className="admin-input"
                        placeholder="Last Name"
                      />
                      <input
                        type="text"
                        value={passenger.firstName}
                        onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)}
                        className="admin-input"
                        placeholder="First Name"
                      />
                      <select
                        value={passenger.gender}
                        onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                        className="admin-input"
                      >
                        <option value="">Gender</option>
                        <option value="Mr">Mr</option>
                        <option value="Ms">Ms</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Miss">Miss</option>
                      </select>
                      <select
                        value={passenger.passengerType || 'Adult'}
                        onChange={(e) => handlePassengerChange(index, 'passengerType', e.target.value)}
                        className="admin-input"
                      >
                        <option value="Adult">Adult</option>
                        <option value="Child">Child</option>
                        <option value="Infant">Infant</option>
                      </select>
                      <input
                        type="text"
                        value={passenger.ticketNumber || ''}
                        onChange={(e) => handlePassengerChange(index, 'ticketNumber', e.target.value)}
                        className="admin-input col-span-2"
                        placeholder="Ticket Number (Optional)"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href="/admin/tickets"
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={isSaving || passengers.length === 0}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
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


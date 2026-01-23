import type { AirlineTicket, FlightJourney, TicketPassenger, JourneyType } from '@unik/shared/types';
import { getAirportNameByCode, getTerminalNumber, formatDateString } from './common';

/**
 * Cebu Pacific PDF Parser
 * Handles both individual and group bookings
 * Supports both English and Korean formats
 */

/**
 * Preprocess text to remove spaces between Korean characters
 * PDF extraction sometimes adds spaces between characters
 */
function preprocessText(text: string): string {
  // Remove spaces between Korean characters (한글 자모 사이 공백 제거)
  // Pattern: (한글)(공백+)(한글) -> (한글)(한글)
  return text.replace(/([가-힣])\s+([가-힣])/g, '$1$2');
}

interface BookingInfo {
  reservationNumber: string;
  bookingDate: string;
  totalSeats: number;
  isGroup: boolean;
}

function extractBookingInfo(textContent: string): BookingInfo {
  console.log('\n📋 Extracting booking info...');
  
  // Reservation number (English or Korean)
  // Pattern: "BOOKING REFERENCE NO. YNVK2K" or "예약번호: APW4RR"
  // Allow spaces between characters
  const reservationPatterns = [
    /BOOKING\s+REFERENCE\s+NO\.\s*[:\s]*([A-Z0-9]+)/i,
    /예\s*약\s*번\s*호\s*[:\s]*([A-Z0-9]+)/i,
    /BOOKING\s+REFERENCE\s+NO\.\s*[:\s]*([A-Z0-9]+)/i
  ];
  
  let reservationNumber = '';
  for (const pattern of reservationPatterns) {
    const match = textContent.match(pattern);
    if (match?.[1]) {
      reservationNumber = match[1].trim();
      console.log('📋 Reservation Number:', reservationNumber);
      break;
    }
  }
  
  // Booking date (English or Korean)
  // Pattern: "BOOKING DATE November 13, 2025" or "예약날짜 November 27, 2025"
  // Allow spaces between characters
  const datePatterns = [
    /BOOKING\s+DATE\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    /예\s*약\s*날\s*짜\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i
  ];
  
  let bookingDate = '';
  for (const pattern of datePatterns) {
    const match = textContent.match(pattern);
    if (match?.[1]) {
      const dateStr = match[1].trim();
      // Convert "November 13, 2025" to "13 NOV 2025"
      bookingDate = convertCebuDateFormat(dateStr);
      console.log('📅 Booking Date:', bookingDate);
      break;
    }
  }
  
  // Count passengers to determine if group booking
  // Use SAME pattern as extractPassengers to ensure consistent count!
  // Pattern: (Title) (FIRSTNAME LASTNAME) followed by (Adult/Child or 성인/어린이)
  const passengerPattern = /(MS\.|MR\.|MSTR\.)\s+([A-Z]+(?:\s+[A-Z]+)+)[\s\S]{0,500}?(?:Adult|Child|성\s*인|어\s*린\s*이)/gi;
  const passengerMatches = [...textContent.matchAll(passengerPattern)];
  const totalSeats = passengerMatches.length;
  
  console.log('👥 Total passengers found:', totalSeats);
  if (totalSeats > 0) {
    console.log('  First 3 passenger names:', passengerMatches.slice(0, 3).map(m => `${m[1]} ${m[2]}`));
  }
  
  return {
    reservationNumber,
    bookingDate,
    totalSeats,
    isGroup: totalSeats >= 10
  };
}

/**
 * Convert Cebu Pacific date format to standard format
 * "November 13, 2025" -> "13 NOV 2025"
 */
function convertCebuDateFormat(dateStr: string): string {
  const monthMap: { [key: string]: string } = {
    'january': 'JAN', 'february': 'FEB', 'march': 'MAR', 'april': 'APR',
    'may': 'MAY', 'june': 'JUN', 'july': 'JUL', 'august': 'AUG',
    'september': 'SEP', 'october': 'OCT', 'november': 'NOV', 'december': 'DEC'
  };
  
  // Parse "November 13, 2025"
  const parts = dateStr.replace(',', '').split(/\s+/);
  if (parts.length === 3) {
    const month = monthMap[parts[0].toLowerCase()] || parts[0].toUpperCase();
    const day = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${day} ${month} ${year}`;
  }
  
  return dateStr;
}

function detectJourneyType(textContent: string): JourneyType {
  console.log('\n🔍 Detecting journey type...');
  
  // Check for both ICN-CEB and CEB-ICN
  const hasOutbound = /ICN\s*[–→-]\s*CEB/i.test(textContent);
  const hasReturn = /CEB\s*[–→-]\s*ICN/i.test(textContent);
  
  console.log('  Outbound (ICN→CEB):', hasOutbound);
  console.log('  Return (CEB→ICN):', hasReturn);
  
  if (hasOutbound && hasReturn) {
    return 'round-trip';
  } else if (hasOutbound || hasReturn) {
    return 'one-way';
  } else {
    throw new Error('여정 정보를 찾을 수 없습니다.');
  }
}

function extractJourneys(textContent: string): FlightJourney[] {
  const journeys: FlightJourney[] = [];
  
  console.log('\n🗺️ Extracting journeys...');
  
  // NEW STRATEGY: Extract from "항공편 세부 정보" section
  // Pattern: "ICN – CEB  03 Jan 2026 · 09:35 PM - 01:25 AM"
  // This section has all the info we need in a simple format!
  
  // Find outbound journey: ICN – CEB or ICN - CEB
  const outboundPattern = /ICN\s*[–-]\s*CEB\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s*·\s*(\d{1,2}):(\d{2})\s+(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s+(AM|PM)/i;
  const outboundMatch = textContent.match(outboundPattern);
  
  if (outboundMatch) {
    console.log('  ✈️ Found outbound journey (ICN→CEB)');
    const journey = parseSimpleDatePattern(outboundMatch, 'ICN', 'CEB', '5J131');
    if (journey) journeys.push(journey);
  }
  
  // Find return journey: CEB – ICN or CEB - ICN
  const returnPattern = /CEB\s*[–-]\s*ICN\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s*·\s*(\d{1,2}):(\d{2})\s+(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s+(AM|PM)/i;
  const returnMatch = textContent.match(returnPattern);
  
  if (returnMatch) {
    console.log('  ✈️ Found return journey (CEB→ICN)');
    const journey = parseSimpleDatePattern(returnMatch, 'CEB', 'ICN', '5J130');
    if (journey) journeys.push(journey);
  }
  
  console.log(`✅ Extracted ${journeys.length} journeys`);
  return journeys;
}

// Parse from simple date pattern: "03 Jan 2026 · 09:35 PM - 01:25 AM"
function parseSimpleDatePattern(
  match: RegExpMatchArray, 
  depCode: string, 
  arrCode: string,
  flightNumber: string
): FlightJourney | null {
  try {
    const day = match[1].padStart(2, '0');
    const month = match[2].toUpperCase();
    const year = match[3];
    let depHour = parseInt(match[4]);
    const depMin = match[5];
    const depPeriod = match[6];
    let arrHour = parseInt(match[7]);
    const arrMin = match[8];
    const arrPeriod = match[9];
    
    // Convert to 24-hour format
    if (depPeriod === 'PM' && depHour !== 12) depHour += 12;
    if (depPeriod === 'AM' && depHour === 12) depHour = 0;
    if (arrPeriod === 'PM' && arrHour !== 12) arrHour += 12;
    if (arrPeriod === 'AM' && arrHour === 12) arrHour = 0;
    
    const departureDate = `${day} ${month} ${year}`;
    const departureTime = `${depHour.toString().padStart(2, '0')}:${depMin}`;
    
    // Arrival might be next day (+1)
    let arrivalDate = `${day} ${month} ${year}`;
    if (arrHour < depHour) {
      // Next day
      const nextDay = (parseInt(day) + 1).toString().padStart(2, '0');
      arrivalDate = `${nextDay} ${month} ${year}`;
    }
    const arrivalTime = `${arrHour.toString().padStart(2, '0')}:${arrMin}`;
    
    console.log(`    📅 ${depCode}→${arrCode}: ${departureDate} ${departureTime} → ${arrivalDate} ${arrivalTime}`);
    
    const terminals = getTerminalNumber(depCode, arrCode);
    
    return {
      flightNumber,
      departureAirportCode: depCode,
      departureAirportName: getAirportNameByCode(depCode),
      departureDate,
      departureTime,
      departureTerminal: terminals.departure,
      arrivalAirportCode: arrCode,
      arrivalAirportName: getAirportNameByCode(arrCode),
      arrivalDate,
      arrivalTime,
      arrivalTerminal: terminals.arrival,
      baggageAllowance: '20kg', // Standard for Cebu Pacific GO Basic
      bookingClass: 'GO Basic'
    };
  } catch (error) {
    console.error('    ❌ Error parsing date pattern:', error);
    return null;
  }
}

function extractPassengers(textContent: string, isGroup: boolean): TicketPassenger[] {
  const passengers: TicketPassenger[] = [];
  
  console.log('\n👥 Extracting passengers...');
  console.log('  Group booking:', isGroup);
  
  // Pattern for passenger entries
  // English: "MS. NAEL KIM\nAdult"
  // Korean: "MR. DONGSOO KWON\n성인"
  // Also: "MS. DASEUL KIM" followed by "성인" much later (up to 500 chars - can span pages!)
  
  // Pattern: (Title) (FIRSTNAME LASTNAME) followed by (Adult/Child or 성인/어린이)
  // Use greedy match for name to capture full name like "DONG HYEON YOO"
  const passengerPattern = /(MS\.|MR\.|MSTR\.)\s+([A-Z]+(?:\s+[A-Z]+)+)[\s\S]{0,500}?(?:Adult|Child|성\s*인|어\s*린\s*이)/gi;
  const matches = [...textContent.matchAll(passengerPattern)];
  
  console.log(`  Found ${matches.length} passenger entries`);
  if (matches.length > 0) {
    console.log(`  Sample matches:`, matches.slice(0, 5).map((m, i) => `#${i+1}: ${m[1]} ${m[2]}`));
  }
  
  // If no matches with Korean, try pattern that's more flexible
  if (matches.length === 0) {
    console.log('  Trying alternative pattern...');
    // Try: "이름 MR. NAME 성인"
    const altPattern = /이름\s+(MS\.|MR\.|MSTR\.)\s+([A-Z]+(?:\s+[A-Z]+)+?)\s*(?:성인|어린이)/gi;
    const altMatches = [...textContent.matchAll(altPattern)];
    console.log(`  Found ${altMatches.length} with alternative pattern`);
    
    for (let i = 0; i < altMatches.length; i++) {
      const match = altMatches[i];
      const title = match[1];
      const fullName = match[2].trim();
      
      const isChild = /MSTR\.|어린이/i.test(match[0]);
      const passengerType = isChild ? 'Child' : 'Adult';
      
      console.log(`  ${i + 1}. ${title} ${fullName} (${passengerType})`);
      
      const nameParts = fullName.split(/\s+/).filter(p => p.length > 0);
      
      if (nameParts.length < 2) {
        console.log('    ❌ Invalid name format, skipping');
        continue;
      }
      
      const firstName = nameParts.slice(0, -1).join(' ');
      const lastName = nameParts[nameParts.length - 1];
      
      let gender: 'Mr' | 'Ms' | 'Mrs' | 'Miss' | '' = '';
      if (title === 'MR.' || title === 'MSTR.') {
        gender = 'Mr';
      } else if (title === 'MS.') {
        gender = 'Ms';
      }
      
      const isDuplicate = passengers.some(p => 
        p.lastName === lastName && p.firstName === firstName
      );
      
      if (!isDuplicate) {
        passengers.push({
          lastName,
          firstName,
          gender,
          ticketNumber: '',
          passengerType
        });
        console.log(`    ✅ Added: ${firstName} ${lastName} (${gender}, ${passengerType})`);
      } else {
        console.log('    ⏭️ Duplicate, skipping');
      }
    }
  }
  
  // Process main matches
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const title = match[1];
    const fullName = match[2].trim();
    
    // Determine passenger type from original match
    const fullMatch = match[0];
    const isChild = /MSTR\.|Child|어린이/i.test(fullMatch);
    const passengerType = isChild ? 'Child' : 'Adult';
    
    console.log(`  ${i + 1}. ${title} ${fullName} (${passengerType})`);
    
    // Parse name: Cebu Pacific uses "FIRSTNAME LASTNAME" format
    const nameParts = fullName.split(/\s+/).filter(p => p.length > 0);
    
    if (nameParts.length < 2) {
      console.log('    ❌ Invalid name format, skipping');
      continue;
    }
    
    // For Cebu Pacific: FIRST NAME is first, LAST NAME is last
    const firstName = nameParts.slice(0, -1).join(' ');
    const lastName = nameParts[nameParts.length - 1];
    
    // Normalize gender from title
    let gender: 'Mr' | 'Ms' | 'Mrs' | 'Miss' | '' = '';
    if (title === 'MR.' || title === 'MSTR.') {
      gender = 'Mr';
    } else if (title === 'MS.') {
      gender = 'Ms';
    }
    
    // Avoid duplicates
    const isDuplicate = passengers.some(p => 
      p.lastName === lastName && p.firstName === firstName
    );
    
    if (!isDuplicate) {
      passengers.push({
        lastName,
        firstName,
        gender,
        ticketNumber: '', // Cebu Pacific PDFs don't show ticket numbers in this format
        passengerType
      });
      console.log(`    ✅ Added: ${firstName} ${lastName} (${gender}, ${passengerType})`);
    } else {
      console.log('    ⏭️ Duplicate, skipping');
    }
  }
  
  console.log(`\n📊 Total extracted: ${passengers.length} passengers`);
  
  return passengers;
}

export function parseCebuPacificPdf(textContent: string): Partial<AirlineTicket> {
  try {
    console.log('\n✈️ ===== CEBU PACIFIC PDF PARSING START =====');
    console.log('📄 Total text length:', textContent.length);
    
    // Preprocess text to remove spaces between Korean characters
    const preprocessedText = preprocessText(textContent);
    console.log('📝 Preprocessed text length:', preprocessedText.length);
    
    const bookingInfo = extractBookingInfo(preprocessedText);
    console.log('\n📋 Booking info:', bookingInfo);
    
    const journeyType = detectJourneyType(preprocessedText);
    console.log('✈️ Journey type detected:', journeyType);
    
    const journeys = extractJourneys(preprocessedText);
    console.log(`🗺️ Journeys extracted: ${journeys.length}`);
    
    const passengers = extractPassengers(preprocessedText, bookingInfo.isGroup);
    console.log(`👥 Passengers extracted: ${passengers.length}`);
    
    return {
      airline: '5J',
      journeyType,
      isGroupBooking: bookingInfo.isGroup,
      totalSeats: bookingInfo.totalSeats || passengers.length,
      reservationNumber: bookingInfo.reservationNumber,
      bookingDate: bookingInfo.bookingDate,
      journeys,
      passengers,
      needsPassengerInput: passengers.length === 0,
      extraServices: [
        { name: '', data: '' },
        { name: '', data: '' },
        { name: '', data: '' },
        { name: '', data: '' }
      ],
      pdfFileName: '',
      agentName: 'Cebu Direct Club Phil. Travel & Tours, Inc.'
    };
  } catch (error) {
    console.error('Cebu Pacific PDF parsing failed:', error);
    throw new Error(`파싱 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
}

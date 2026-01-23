import type { AirlineTicket, FlightJourney, TicketPassenger, JourneyType } from '@unik/shared/types';
import { getAirportNameByCode, getTerminalNumber, formatDateString } from './common';

/**
 * JEJU Air PDF Parser
 * Handles both individual and group bookings
 */

interface BookingInfo {
  reservationNumber: string;
  bookingDate: string;
  totalSeats: number;
  isGroup: boolean;
}

function extractBookingInfo(textContent: string): BookingInfo {
  // Reservation number (PDF text format)
  const reservationPattern = /(Booking reference|예약번호)[:\s]*([\w\d]+)/i;
  const resMatch = textContent.match(reservationPattern);
  const reservationNumber = resMatch?.[2]?.trim() || '';
  
  // Booking date (PDF text format: 2024.10.27 or 2024. 10. 27)
  const datePattern = /(Booking date|예약일)[:\s]*(\d{4}[\.\s]+\d{1,2}[\.\s]+\d{1,2})/i;
  const dateMatch = textContent.match(datePattern);
  let bookingDate = '';
  if (dateMatch?.[2]) {
    // Normalize date format: remove spaces
    const normalized = dateMatch[2].replace(/\s+/g, '.');
    bookingDate = formatDateString(normalized);
  }
  
  // Total seats (그룹 발권의 경우)
  const seatsPattern = /예약석[:\s]*(\d+)\s*석|Reserved\s*Seats[:\s]*(\d+)/i;
  const seatsMatch = textContent.match(seatsPattern);
  const totalSeats = parseInt(seatsMatch?.[1] || seatsMatch?.[2] || '1');
  
  return {
    reservationNumber,
    bookingDate,
    totalSeats,
    isGroup: totalSeats >= 10
  };
}

function detectJourneyType(textContent: string): JourneyType {
  const hasOriginating = /Originating\s*Flight|가는\s*편/i.test(textContent);
  const hasReturn = /Return\s*Flight|오는\s*편/i.test(textContent);
  
  if (hasOriginating && hasReturn) {
    return 'round-trip';
  } else if (hasOriginating) {
    return 'one-way';
  } else {
    throw new Error('여정 정보를 찾을 수 없습니다.');
  }
}

function parseJourneyContent(content: string): FlightJourney | null {
  try {
    console.log('🔍 Parsing journey content:', content.substring(0, 500));
    
    // Flight number (PDF text: "편명 7C2603" or "Flight 7C2603")
    const flightPattern = /(Flight|편명)[:\s]*(7C\d{4}|\w{2}\d{3,4})/i;
    const flightMatch = content.match(flightPattern);
    const flightNumber = flightMatch?.[2] || '';
    
    console.log('✈️ Flight number:', flightNumber);
    
    if (!flightNumber) {
      console.warn('❌ No flight number found');
      return null;
    }
    
    // Airport codes
    const airportPattern = /(?:[\w가-힣\s]+)?\s*\(([A-Z]{3})\)/gi;
    const airportMatches = [...content.matchAll(airportPattern)];
    
    console.log('🏢 Airport matches:', airportMatches.map(m => m[1]));
    
    if (airportMatches.length < 2) {
      console.warn('❌ Not enough airports found:', airportMatches.length);
      return null;
    }
    
    const departureAirportCode = airportMatches[0][1];
    const arrivalAirportCode = airportMatches[1][1];
    
    const departureAirportName = getAirportNameByCode(departureAirportCode);
    const arrivalAirportName = getAirportNameByCode(arrivalAirportCode);
    
    console.log('🛫 Departure:', departureAirportCode, departureAirportName);
    console.log('🛬 Arrival:', arrivalAirportCode, arrivalAirportName);
    
    // Date/time extraction
    const dateTimePattern = /(\d{4}[\s.]*\d{1,2}[\s.]*\d{1,2})\s*\([^\)]+\)\s*(\d{1,2}:\d{2})/gi;
    const dateTimeMatches = [...content.matchAll(dateTimePattern)];
    
    console.log('📅 DateTime matches:', dateTimeMatches.map(m => [m[1], m[2]]));
    
    if (dateTimeMatches.length < 2) {
      console.warn('❌ Not enough date/time found:', dateTimeMatches.length);
      
      // Try alternative pattern without day of week
      const altDateTimePattern = /(\d{4}[\s.]*\d{1,2}[\s.]*\d{1,2})\s+(\d{1,2}:\d{2})/gi;
      const altMatches = [...content.matchAll(altDateTimePattern)];
      
      console.log('📅 Alternative DateTime matches:', altMatches.map(m => [m[1], m[2]]));
      
      if (altMatches.length < 2) {
        return null;
      }
      
      // Use alternative matches
      const depDate = altMatches[0][1].replace(/\s+/g, '.');
      const depTime = altMatches[0][2];
      const arrDate = altMatches[1][1].replace(/\s+/g, '.');
      const arrTime = altMatches[1][2];
      
      const departureDate = formatDateString(depDate);
      const departureTime = depTime;
      const arrivalDate = formatDateString(arrDate);
      const arrivalTime = arrTime;
      
      // Terminal info
      const terminals = getTerminalNumber(departureAirportCode, arrivalAirportCode);
      
      // Baggage
      const baggagePattern = /(\d+)\s*[Kk][Gg]|(\d+)Kg/gi;
      const baggageMatch = content.match(baggagePattern);
      const baggageAllowance = baggageMatch?.[0] || '';
      
      // Booking class
      const bookingClassPatterns = [
        /(?:가는\s*편|오는\s*편|Originating\s*Flight|Return\s*Flight)\s*[|=]+\s*[^|=]*[|=]+\s*([\w가-힣\s]+?)(?=\s*\n|항공|편명|Flight|\s*[|=]|$)/i,
        /(?:가는\s*편|오는\s*편|Originating\s*Flight|Return\s*Flight)\s*[|=]+\s*([\w가-힣\s]+?)(?=\s*\n|항공|편명|Flight|\s*[|=]|$)/i,
        /(?:가는\s*편|오는\s*편|Originating\s*Flight|Return\s*Flight)\s{2,}(?:터미널\s*\d+\s+)?([\w가-힣\s]+?)(?=\s*\n|항공|편명|Flight|$)/i,
        /클래스[:\s]*([\w가-힣\s]+?)(?=\s*\n|\s*$|\s{2,})/i,
        /Class[:\s]*([\w\s]+?)(?=\s*\n|\s*$|\s{2,})/i,
        /([\w가-힣\s]+)\s+GRP/i,
        /(?:^|\n)([A-Z])(?:\s*\n|\s*$)/m
      ];
      
      let bookingClass = '';
      for (const pattern of bookingClassPatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          bookingClass = match[1].trim();
          console.log(`💺 Booking class found (alt): "${bookingClass}"`);
          break;
        }
      }
      
      return {
        flightNumber,
        departureAirportCode,
        departureAirportName,
        departureDate,
        departureTime,
        departureTerminal: terminals.departure,
        arrivalAirportCode,
        arrivalAirportName,
        arrivalDate,
        arrivalTime,
        arrivalTerminal: terminals.arrival,
        bookingClass,
        notValidBefore: departureDate,
        notValidAfter: departureDate,
        baggageAllowance
      };
    }
    
    // Use standard matches
    const depDate = dateTimeMatches[0][1].replace(/\s+/g, '.');
    const depTime = dateTimeMatches[0][2];
    const arrDate = dateTimeMatches[1][1].replace(/\s+/g, '.');
    const arrTime = dateTimeMatches[1][2];
    
    const departureDate = formatDateString(depDate);
    const departureTime = depTime;
    const arrivalDate = formatDateString(arrDate);
    const arrivalTime = arrTime;
    
    console.log('📅 Parsed dates:', { departureDate, departureTime, arrivalDate, arrivalTime });
    
    // Terminal info
    const terminals = getTerminalNumber(departureAirportCode, arrivalAirportCode);
    
    // Baggage allowance
    const baggagePattern = /(\d+)\s*[Kk][Gg]|(\d+)Kg/gi;
    const baggageMatch = content.match(baggagePattern);
    const baggageAllowance = baggageMatch?.[0] || '';
    
    console.log('🧳 Baggage:', baggageAllowance);
    
    // Booking class
    const bookingClassPatterns = [
      /(?:가\s*는\s*편|오\s*는\s*편|Originating\s*Flight|Return\s*Flight)\s*[|=]+\s*[^|=]*[|=]+\s*(?:터\s*미\s*널\s*\d+\s+)?([\w가-힣\s]+?)(?=\s*\n|항공|편명|Flight|\s*[|=]|$)/i,
      /(?:가\s*는\s*편|오\s*는\s*편|Originating\s*Flight|Return\s*Flight)\s*[|=]+\s*(?!터\s*미\s*널|Terminal)([\w가-힣\s]+?)(?=\s*\n|항공|편명|Flight|\s*[|=]|$)/i,
      /(?:가\s*는\s*편|오\s*는\s*편|Originating\s*Flight|Return\s*Flight)\s{2,}(?:터\s*미\s*널\s*\d+\s+)?([\w가-힣\s]+?)(?=\s*\n|항공|편명|Flight|$)/i,
      /클\s*래\s*스[:\s]*([\w가-힣\s]+?)(?=\s*\n|\s*$|\s{2,})/i,
      /Class[:\s]*([\w\s]+?)(?=\s*\n|\s*$|\s{2,})/i,
      /([\w가-힣\s]+)\s+GRP/i,
      /(?:^|\n)([A-Z])(?:\s*\n|\s*$)/m
    ];
    
    let bookingClass = '';
    for (const pattern of bookingClassPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        let candidate = match[1].trim().replace(/\s+/g, ' ');
        if (/터\s*미\s*널|Terminal/i.test(candidate)) {
          console.log(`  ❌ 건너뜀: 터미널 포함 ("${candidate}")`);
          continue;
        }
        bookingClass = candidate;
        console.log(`💺 Booking class found: "${bookingClass}"`);
        break;
      }
    }
    
    return {
      flightNumber,
      departureAirportCode,
      departureAirportName,
      departureDate,
      departureTime,
      departureTerminal: terminals.departure,
      arrivalAirportCode,
      arrivalAirportName,
      arrivalDate,
      arrivalTime,
      arrivalTerminal: terminals.arrival,
      bookingClass,
      notValidBefore: departureDate,
      notValidAfter: departureDate,
      baggageAllowance
    };
  } catch (error) {
    console.error('❌ Journey parsing error:', error);
    return null;
  }
}

function extractJourneys(textContent: string): FlightJourney[] {
  const journeys: FlightJourney[] = [];
  
  const origIndex = textContent.search(/Originating\s*Flight|가는\s*편/i);
  const returnIndex = textContent.search(/Return\s*Flight|오는\s*편/i);
  
  console.log('🔍 Journey detection:', {
    origIndex,
    returnIndex,
    hasOrig: origIndex !== -1,
    hasReturn: returnIndex !== -1
  });
  
  if (origIndex === -1) {
    throw new Error('가는편 정보를 찾을 수 없습니다.');
  }
  
  // Parse originating flight
  const origContent = returnIndex !== -1 
    ? textContent.substring(origIndex, returnIndex)
    : textContent.substring(origIndex);
  
  console.log('📝 Originating flight content length:', origContent.length);
  
  const origJourney = parseJourneyContent(origContent);
  if (origJourney) {
    journeys.push(origJourney);
  }
  
  // Parse return flight (if exists)
  if (returnIndex !== -1) {
    const returnContent = textContent.substring(returnIndex);
    console.log('📝 Return flight content length:', returnContent.length);
    
    const returnJourney = parseJourneyContent(returnContent);
    if (returnJourney) {
      journeys.push(returnJourney);
    } else {
      console.warn('⚠️ Return flight found but parsing failed');
    }
  }
  
  return journeys;
}

function extractPassengers(textContent: string, isGroup: boolean): TicketPassenger[] {
  const passengers: TicketPassenger[] = [];
  
  if (isGroup) {
    // Group booking: extract passenger list
    console.log('\n👥 그룹 발권 승객 추출 시작');
    
    const passengerPattern1 = /(성인|소아|Adult|Child)\s+(\d+)\s+([A-Z][A-Z\s]+?)(?=\s+USD|\s+항공|\s+성인|\s+소아|\s+Adult|\s+Child|\s+\d+\/\d+|cebu-jinair|\s*\n\s*\n|$)/gi;
    const matches1 = [...textContent.matchAll(passengerPattern1)];
    
    const passengerPattern2 = /(성인|소아|Adult|Child)\s+(\d+)\s+([A-Z]+(?:\s+[A-Z]+){1,3})/gi;
    const matches2 = [...textContent.matchAll(passengerPattern2)];
    
    let matches = matches1;
    if (matches2.length > matches.length) matches = matches2;
    
    for (const match of matches) {
      const passengerType = match[1];
      const passengerNum = match[2];
      const fullName = match[3]?.trim().replace(/\s+/g, ' ');
      
      if (!fullName || fullName.length < 3) continue;
      if (/\d|[^\w\s]/.test(fullName)) continue;
      
      const nameParts = fullName.split(/\s+/).filter(p => p.length > 0);
      if (nameParts.length < 2) continue;
      
      const lastName = nameParts[0];
      const firstName = nameParts.slice(1).join(' ');
      
      const isDuplicate = passengers.some(p => 
        p.lastName === lastName && p.firstName === firstName
      );
      
      if (!isDuplicate) {
        passengers.push({
          lastName,
          firstName,
          gender: '',
          ticketNumber: '',
          type: passengerType.includes('소아') || passengerType.toLowerCase().includes('child') ? 'Child' : 'Adult'
        });
      }
    }
  } else {
    // Individual booking
    console.log('\n👤 개별 발권 승객 추출 시작');
    
    const pattern1 = /(?:성\s*인|소\s*아|Adult|Child)\s+\d+\s+([\w\s\/]+?)(?=\s*\n|\s+[A-Z]{3}\s+[\d,]+|\s+[\d]{3,}|\s+[가-힣]{2,}|$)/gi;
    const matches = [...textContent.matchAll(pattern1)];
    
    for (const match of matches) {
      const fullName = match[1]?.trim();
      if (!fullName || /\d{3,}/.test(fullName)) continue;
      
      let lastName = '';
      let firstName = '';
      
      if (fullName.includes('/')) {
        [lastName, firstName] = fullName.split('/').map(s => s.trim());
      } else if (fullName.includes(' ')) {
        const parts = fullName.split(/\s+/);
        lastName = parts[0];
        firstName = parts.slice(1).join(' ');
      } else {
        lastName = fullName;
      }
      
      const isDuplicate = passengers.some(p => 
        p.lastName === lastName && p.firstName === firstName
      );
      
      if (!isDuplicate && lastName) {
        const passengerType = /소\s*아|Child/i.test(match[0]) ? 'Child' : 'Adult';
        passengers.push({
          lastName,
          firstName,
          gender: '',
          ticketNumber: '',
          passengerType
        });
      }
    }
  }
  
  return passengers;
}

export function parseJejuAirPdf(textContent: string): Partial<AirlineTicket> {
  try {
    console.log('\n🎫 ===== JEJU AIR PDF PARSING START =====');
    console.log('📄 Total text length:', textContent.length);
    
    const bookingInfo = extractBookingInfo(textContent);
    console.log('📋 Booking info:', bookingInfo);
    
    const journeyType = detectJourneyType(textContent);
    console.log('✈️ Journey type detected:', journeyType);
    
    const journeys = extractJourneys(textContent);
    console.log('🗺️ Journeys extracted:', journeys.length);
    
    const passengers = extractPassengers(textContent, bookingInfo.isGroup);
    console.log('👥 Passengers extracted:', passengers.length);
    
    return {
      airline: 'JEJU',
      journeyType,
      isGroupBooking: bookingInfo.isGroup,
      totalSeats: bookingInfo.totalSeats,
      reservationNumber: bookingInfo.reservationNumber,
      bookingDate: bookingInfo.bookingDate,
      journeys,
      passengers,
      needsPassengerInput: bookingInfo.isGroup || passengers.length === 0,
      extraServices: [
        { name: '', data: '' },
        { name: '', data: '' },
        { name: '', data: '' },
        { name: '', data: '' }
      ]
    };
  } catch (error) {
    console.error('JEJU Air PDF parsing failed:', error);
    throw new Error(`파싱 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
}



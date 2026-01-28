import type { AirlineTicket, FlightJourney, TicketPassenger, JourneyType } from '@unik/shared/types';

/**
 * JIN Air HTML Parser
 * Parses HTML format e-tickets from Jin Air
 */

function normalizeAirportName(name: string): string {
  const cleaned = name
    .replace(/International Airport/gi, '')
    .replace(/Airport/gi, '')
    .replace(/Mactan/gi, '')
    .trim();
  
  return cleaned
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function parseJinAirJourney(htmlContent: string, startIndex: number): FlightJourney | null {
  try {
    // Extract a larger section to ensure we capture all flight details
    const actualStart = Math.max(0, startIndex - 500);
    const sectionContent = htmlContent.substring(actualStart, startIndex + 5000);
    
    console.log('\n📝 Parsing journey from index:', startIndex, '(actual start:', actualStart, ')');

    // Flight number
    const flightPattern = /Flight No\s+<strong>\s*LJ\s+(\d+)<\/strong>/i;
    const flightMatch = sectionContent.match(flightPattern);
    const flightNumber = flightMatch ? `LJ${flightMatch[1]}` : '';
    console.log('✈️ Flight:', flightNumber);

    // Departure airport
    const deptAirportPattern = /DEPARTING[^<]*<\/strong><br>\s*<font[^>]*>\s*([^,<]+),?\s*([^<]*)<br>/i;
    const deptMatch = sectionContent.match(deptAirportPattern);
    const departureAirportName = deptMatch?.[1]?.trim() || '';
    
    // Extract airport codes
    const airportCodePattern = /([A-Z]{3})\s+TO\s+([A-Z]{3})/i;
    const codeMatch = sectionContent.match(airportCodePattern);
    const departureAirportCode = codeMatch?.[1] || '';
    const arrivalAirportCode = codeMatch?.[2] || '';

    // Arrival airport
    const arrAirportPattern = /ARRIVING[^<]*<\/strong><br>\s*<font[^>]*>\s*([^,<]+),?\s*([^<]*)<br>/i;
    const arrMatch = sectionContent.match(arrAirportPattern);
    const arrivalAirportName = arrMatch?.[1]?.trim() || '';

    console.log(`🛫 ${departureAirportCode} ${departureAirportName} → 🛬 ${arrivalAirportCode} ${arrivalAirportName}`);

    // Departure date/time
    console.log('\n🔍 출발 시간 파싱 시작...');
    
    let departureTime = '';
    let departureDate = '';
    
    // Try multiple patterns
    const deptPatterns = [
      // Pattern 1: "0145hr, Thu 26 Feb 2026" (comma after hr, no comma after day name)
      /(\d{4})hr\s*,\s*[A-Za-z]{3,4}\s+(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/i,
      // Pattern 2: "2245hr, Wed, 25 FEB 2026" (comma after hr and day name)
      /(\d{4})hr\s*,\s*[A-Za-z]{3,4},\s*(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/i,
      // Pattern 3: "2245hr Wed 25 FEB 2026" (no comma)
      /(\d{4})hr\s+[A-Za-z]{3,4}\s+(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/i,
      // Pattern 4: Look for time near DEPARTING
      /DEPARTING[^<]*<\/strong>[^<]*<br>[^<]*<br>[^<]*(\d{4})hr[^<]*(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/i
    ];
    
    for (let i = 0; i < deptPatterns.length; i++) {
      const pattern = deptPatterns[i];
      const match = sectionContent.match(pattern);
      if (match) {
        const timeStr = match[1];
        departureTime = `${timeStr.substring(0, 2)}:${timeStr.substring(2)}`;
        const day = match[2].padStart(2, '0');
        const month = match[3].toUpperCase();
        const year = match[4];
        departureDate = `${day} ${month} ${year}`;
        console.log(`✅ 출발 시간 발견 (패턴 ${i + 1}):`, departureTime, departureDate);
        break;
      }
    }
    
    if (!departureDate) {
      console.log('⚠️ 출발 날짜를 찾을 수 없음');
      // Debug: show sample of content
      console.log('🔍 샘플 내용:', sectionContent.substring(0, 800));
    }

    // Arrival date/time
    console.log('\n🔍 도착 시간 파싱 시작...');
    
    let arrivalTime = '';
    let arrivalDate = '';
    
    const arrivingIndex = sectionContent.indexOf('ARRIVING');
    if (arrivingIndex !== -1) {
      console.log('✅ ARRIVING 발견 at index:', arrivingIndex);
      
      const afterArriving = sectionContent.substring(arrivingIndex);
      const timePattern = /(\d{4})hr/;
      const timeMatch = afterArriving.match(timePattern);
      
      if (timeMatch) {
        const timeStr = timeMatch[1];
        arrivalTime = `${timeStr.substring(0, 2)}:${timeStr.substring(2)}`;
        console.log('✅ 시간 발견:', arrivalTime, 'from', timeMatch[0]);
        
        const timeIndex = afterArriving.indexOf(timeMatch[0]);
        const afterTime = afterArriving.substring(timeIndex + timeMatch[0].length);
        
        const datePattern = /(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/;
        const dateMatch = afterTime.match(datePattern);
        
        if (dateMatch) {
          const day = dateMatch[1].padStart(2, '0');
          const month = dateMatch[2].toUpperCase();
          const year = dateMatch[3];
          arrivalDate = `${day} ${month} ${year}`;
          console.log('✅ 날짜 발견:', arrivalDate);
        }
      }
    }

    // Baggage allowance
    let baggageAllowance = '';
    const baggagePattern = /Baggage\s+allowance\s+(\d+\s*[Kk]g)/i;
    const baggageMatch = sectionContent.match(baggagePattern);
    if (baggageMatch) {
      baggageAllowance = baggageMatch[1].replace(/\s+/g, '');
      console.log(`🧳 수하물: ${baggageAllowance}`);
    }

    console.log(`📅 Departure: ${departureDate} ${departureTime}`);
    console.log(`📅 Arrival: ${arrivalDate} ${arrivalTime}`);

    // Flight time
    let flightTime = '';
    const flightTimePattern = /Flight\s+time:\s*(\d{2}hr\s+\d{2}mins)/i;
    const flightTimeMatch = sectionContent.match(flightTimePattern);
    if (flightTimeMatch) {
      flightTime = flightTimeMatch[1];
      console.log(`⏱️ Flight time: ${flightTime}`);
    }

    // Terminal
    const deptTerminalPattern = /DEPARTING[^<]*<\/strong><br>[^(]*\(Terminal\s+(\d+)\)/i;
    const deptTermMatch = sectionContent.match(deptTerminalPattern);
    const departureTerminal = deptTermMatch?.[1] || undefined;

    const arrTerminalPattern = /ARRIVING[^<]*<\/strong><br>[^(]*\(Terminal\s+(\d+)\)/i;
    const arrTermMatch = sectionContent.match(arrTerminalPattern);
    const arrivalTerminal = arrTermMatch?.[1] || undefined;

    // Not valid before/after
    const notValidBeforePattern = /Not valid before:\s*(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/i;
    const nvbMatch = sectionContent.match(notValidBeforePattern);
    let notValidBefore = '';
    if (nvbMatch) {
      const day = nvbMatch[1].padStart(2, '0');
      const month = nvbMatch[2].toUpperCase();
      const year = nvbMatch[3];
      notValidBefore = `${day} ${month} ${year}`;
    }

    const notValidAfterPattern = /Not valid after:\s*(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/i;
    const nvaMatch = sectionContent.match(notValidAfterPattern);
    let notValidAfter = '';
    if (nvaMatch) {
      const day = nvaMatch[1].padStart(2, '0');
      const month = nvaMatch[2].toUpperCase();
      const year = nvaMatch[3];
      notValidAfter = `${day} ${month} ${year}`;
    }

    // Booking class
    const farePattern = /<strong>\s*([A-Z]{3})\s+TO\s+[A-Z]{3}<\/strong>[^<]*<\/td>\s*<td[^>]*>\s*<strong>\s*([A-Z]+)/i;
    const fareMatch = htmlContent.substring(startIndex - 200, startIndex + 500).match(farePattern);
    const bookingClass = fareMatch?.[2] || '';
    console.log(`💺 Booking class: ${bookingClass}`);

    return {
      flightNumber,
      airline: 'LJ',
      departureAirportCode,
      departureAirportName: normalizeAirportName(departureAirportName),
      departureDate,
      departureTime,
      departureTerminal,
      arrivalAirportCode,
      arrivalAirportName: normalizeAirportName(arrivalAirportName),
      arrivalDate,
      arrivalTime,
      arrivalTerminal,
      bookingClass,
      notValidBefore,
      notValidAfter,
      baggageAllowance,
      flightTime
    };
  } catch (error) {
    console.error('Journey parsing error:', error);
    return null;
  }
}

function parseJinAirPassengers(htmlContent: string, isGroupBooking: boolean): TicketPassenger[] {
  const passengers: TicketPassenger[] = [];

  // Pattern: "1. BANDOY, ROEL JR&nbsp;MR&nbsp; ... [Ticket Number:&nbsp; 7182382992079]"
  const passengerPattern = /(\d+)\.\s+([A-Z]+),\s+([\w\s]+?)&nbsp;(MR|MS|MISS|MRS|MSTR)&nbsp;[^[]*?\[Ticket Number:&nbsp;\s*(\d+)\s*\]/gis;
  
  const matches = [...htmlContent.matchAll(passengerPattern)];
  console.log(`\n👥 Found ${matches.length} passenger entries`);

  for (const match of matches) {
    const passengerNum = match[1];
    const lastName = match[2].trim();
    const firstName = match[3].trim();
    const title = match[4].trim();
    const ticketNumber = match[5].trim();

    console.log(`🔍 #${passengerNum}: ${lastName}, ${firstName} (${title}) - Ticket: ${ticketNumber}`);

    // Normalize gender
    let gender: 'Mr' | 'Ms' | 'Mrs' | 'Miss' | '' = '';
    if (title === 'MR') {
      gender = 'Mr';
    } else if (title === 'MS') {
      gender = 'Ms';
    } else if (title === 'MISS') {
      gender = 'Miss';
    } else if (title === 'MRS') {
      gender = 'Mrs';
    } else if (title === 'MSTR') {
      gender = 'Mr';
    }

    const passengerType = (title === 'MSTR') ? 'Child' : 'Adult';

    passengers.push({
      lastName,
      firstName,
      gender,
      passengerType,
      ticketNumber
    });

    console.log(`✅ ${lastName} ${firstName} (${gender}, ${passengerType}) - ${ticketNumber}`);
  }

  return passengers;
}

export function parseJinAirHtml(htmlContent: string): Partial<AirlineTicket> {
  try {
    console.log('\n✈️ ===== JIN AIR HTML PARSING START =====');
    console.log('📄 Total HTML length:', htmlContent.length);

    // 1. Extract reservation number
    const reservationPattern = /Reservation Number:\s*<\/td>\s*<td[^>]*><strong>([A-Z0-9]+)<\/strong>/i;
    const reservationMatch = htmlContent.match(reservationPattern);
    const reservationNumber = reservationMatch?.[1] || '';
    console.log('📋 Reservation Number:', reservationNumber);

    // 2. Check if group booking
    const groupPattern = /Group Name:\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i;
    const groupMatch = htmlContent.match(groupPattern);
    const isGroupBooking = !!groupMatch;
    const groupName = groupMatch?.[1]?.trim() || '';
    console.log('👥 Group booking:', isGroupBooking, groupName);

    // 3. Extract journey type and journeys
    const journeys: FlightJourney[] = [];
    
    const journeyPattern = /<strong>\s*([A-Z]{3})\s+TO\s+([A-Z]{3})<\/strong>/gi;
    const journeyMatches = [...htmlContent.matchAll(journeyPattern)];
    console.log(`🗺️ Found ${journeyMatches.length} journeys`);

    const journeyType: JourneyType = journeyMatches.length >= 2 ? 'round-trip' : 'one-way';
    console.log('✈️ Journey type:', journeyType);

    // Parse each journey
    for (const journeyMatch of journeyMatches) {
      const journey = parseJinAirJourney(htmlContent, journeyMatch.index || 0);
      if (journey) {
        journeys.push(journey);
      }
    }

    // 4. Extract passengers
    const passengers = parseJinAirPassengers(htmlContent, isGroupBooking);
    console.log(`👥 Extracted ${passengers.length} passengers`);

    // 5. Booking date
    const invoiceDatePattern = /Invoice Date:\s*(\d{1,2})-([A-Za-z]{3})-(\d{4})/i;
    const invoiceMatch = htmlContent.match(invoiceDatePattern);
    let bookingDate = '';
    if (invoiceMatch) {
      const day = invoiceMatch[1].padStart(2, '0');
      const monthStr = invoiceMatch[2].toUpperCase();
      const year = invoiceMatch[3];
      bookingDate = `${day} ${monthStr} ${year}`;
      console.log('📅 Booking date:', bookingDate);
    }

    return {
      airline: 'JIN',
      journeyType,
      isGroupBooking,
      totalSeats: passengers.length,
      reservationNumber,
      bookingDate,
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
    console.error('JIN Air HTML parsing failed:', error);
    throw new Error(`파싱 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
}



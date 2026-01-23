import type { TicketPassenger } from '@unik/shared/types';

/**
 * Parse Air Busan passenger name list (NAMELIST) PDF
 * Only extracts passenger information - journey info must be manually entered
 * 
 * @param textContent - Raw text extracted from PDF
 * @returns passengers array, reservation number, and raw text
 */
export function parseAirBusanNameList(textContent: string): {
  passengers: TicketPassenger[];
  reservationNumber: string;
  rawText: string;
} {
  console.log('\n✈️ ===== AIR BUSAN NAMELIST PARSING START =====');
  console.log('📄 Total text length:', textContent.length);
  console.log('📝 First 500 chars:', textContent.substring(0, 500));

  // Preprocess text
  const cleanedText = preprocessText(textContent);
  console.log('📝 Preprocessed text length:', cleanedText.length);

  // Extract reservation number (PNR)
  const reservationNumber = extractReservationNumber(cleanedText);
  console.log('📋 Reservation Number:', reservationNumber);

  // Extract passengers
  const passengers = extractPassengers(cleanedText);
  console.log(`✅ Extracted ${passengers.length} passengers`);

  return {
    passengers,
    reservationNumber,
    rawText: cleanedText
  };
}

/**
 * Preprocess text to clean up spacing issues
 */
function preprocessText(text: string): string {
  // Remove extra spaces between Korean characters
  let cleanedText = text.replace(/([가-힣])\s+([가-힣])/g, '$1$2');
  
  // Normalize common labels
  cleanedText = cleanedText.replace(/영\s*문\s*성/g, '영문성');
  cleanedText = cleanedText.replace(/영\s*문\s*이\s*름/g, '영문이름');
  cleanedText = cleanedText.replace(/성\s*별/g, '성별');
  cleanedText = cleanedText.replace(/여\s*권\s*번\s*호/g, '여권번호');
  cleanedText = cleanedText.replace(/생\s*년\s*월\s*일/g, '생년월일');
  
  return cleanedText;
}

/**
 * Extract reservation number (PNR) from namelist
 */
function extractReservationNumber(textContent: string): string {
  console.log('\n📋 Extracting reservation number...');
  
  // Pattern: PNR column usually has a consistent value for all passengers
  // Example: "E8TX89" appears after route codes (CEB PUS)
  // Look for alphanumeric code between route codes and dates
  const pnrPattern = /[A-Z]{3}\s+[A-Z]{3}(?:\s+[A-Z]{3})?\s+([A-Z0-9]{6})\s+\d{1,2}\/\d{1,2}/;
  const match = textContent.match(pnrPattern);
  
  if (match && match[1]) {
    console.log(`  ✅ Found PNR: ${match[1]}`);
    return match[1];
  }
  
  console.log(`  ❌ PNR not found`);
  return '';
}

/**
 * Extract passengers from namelist
 * Pattern: Number + route codes + PNR + dates + SURNAME + GIVEN NAME + TITLE
 */
function extractPassengers(textContent: string): TicketPassenger[] {
  const passengers: TicketPassenger[] = [];
  console.log('\n👥 Extracting passengers from namelist...');

  // Pattern to match passenger entries globally
  // Format: "번호 CEB PUS 예약번호 출발일 리턴일 영문성 영문이름 성별"
  // Example: "1   CEB   PUS   E8TX89   2/26   3/1   GUBAT   VAN VIDAL JR   MR"
  // The text may not have line breaks, so we use global search
  
  // Pattern breakdown:
  // (\d+) - passenger number
  // \s+ - whitespace
  // [A-Z]{3}\s+[A-Z]{3} - two airport codes (CEB PUS or CEB PUS PUS CJU for multi-leg)
  // (?:\s+[A-Z]{3})* - optional additional airport codes
  // \s+[A-Z0-9]+ - PNR (reservation number)
  // \s+\d{1,2}\/\d{1,2} - departure date (2/26)
  // \s+\d{1,2}\/\d{1,2} - return date (3/1)
  // \s+([A-Z]+) - SURNAME (capture)
  // \s+([A-Z\s]+?) - GIVEN NAME (capture, may have spaces)
  // \s+(MR|MS|MSTR) - GENDER (capture)
  
  const passengerPattern = /(\d+)\s+[A-Z]{3}\s+[A-Z]{3}(?:\s+[A-Z]{3})?(?:\s+[A-Z]{3})?\s+[A-Z0-9]+\s+\d{1,2}\/\d{1,2}\s+\d{1,2}\/\d{1,2}\s+([A-Z]+)\s+([A-Z\s]+?)\s+(MR|MS|MSTR)\s+/g;
  
  const matches = [...textContent.matchAll(passengerPattern)];
  console.log(`🔍 Found ${matches.length} potential passenger matches`);
  
  for (const match of matches) {
    const [, rowNum, surname, givenName, gender] = match;
    
    // Clean up names
    const cleanSurname = surname.trim();
    const cleanGivenName = givenName.trim();
    
    console.log(`  Found: #${rowNum} - ${cleanSurname} / ${cleanGivenName} / ${gender}`);
    
    // Skip if names are empty or too short
    if (!cleanSurname || !cleanGivenName || 
        cleanSurname.length < 2 || cleanGivenName.length < 2) {
      console.log(`    ❌ Skipped: name too short`);
      continue;
    }
    
    // Skip if surname looks like airport code
    if (['CEB', 'PUS', 'CJU', 'ICN', 'ROUTE', 'PNR', 'DPT', 'RTN'].includes(cleanSurname)) {
      console.log(`    ❌ Skipped: looks like header/code`);
      continue;
    }

    // Try to find age for this passenger (look after the gender in the remaining text)
    const afterMatch = textContent.substring(match.index! + match[0].length, match.index! + match[0].length + 200);
    const ageMatch = afterMatch.match(/\s+(\d+)\s+ADT/);
    const age = ageMatch ? parseInt(ageMatch[1]) : null;
    
    let type = 'Adult';
    if (age !== null) {
      if (age < 2) type = 'Infant';
      else if (age < 12) type = 'Child';
    }

    const passenger: TicketPassenger = {
      firstName: cleanGivenName,
      lastName: cleanSurname,
      gender: gender === 'MS' ? 'Ms' : (gender === 'MSTR' ? 'Mstr' : 'Mr'),
      type: type as 'Adult' | 'Child' | 'Infant',
      ticketNumber: '',
      baggageAllowance: '15kg'
    };

    passengers.push(passenger);
    console.log(`  ✅ #${rowNum}: ${gender} ${cleanSurname} ${cleanGivenName} (${type}, age: ${age || 'unknown'})`);
  }

  console.log(`📊 Total extracted: ${passengers.length} passengers`);
  return passengers;
}


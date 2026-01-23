/**
 * Parse JEJU Air Name List PDF
 * Format: CDC Travel passenger list with surname, given name, title, age classification
 */
export function parseJejuAirNameList(textContent: string): { 
  pnr: string; 
  passengers: Array<{
    surname: string;
    given: string;
    title: string; // MR, MS, MISS, MISTER
    gender: 'Mr' | 'Ms' | 'Mrs' | 'Miss'; // Normalized
    classification: 'ADT' | 'CHD'; // Adult or Child
    passportNumber?: string;
    nationality?: string;
    dateOfBirth?: string;
    age?: number;
  }>;
} {
  const result = {
    pnr: '',
    passengers: [] as any[]
  };

  // Extract PNR (예탁번호 column)
  const pnrPattern = /PNR[^\n]*\n[^\n]*?([A-Z0-9]{6})/i;
  const pnrMatch = textContent.match(pnrPattern);
  if (pnrMatch) {
    result.pnr = pnrMatch[1];
  }

  // Pattern for passenger rows in the table
  // Format: "1 CEB ICN I611UV 9/25 9/28 CABRERA NINO MR PH P3528250B 2029.10.14 1983/03/05 42 ADT"
  // Note: PNR can be 5-7 characters (I611UV, I6I1UV)
  // Note: Nationality can be 2-3 characters (PH, USA)
  // Note: Passport can be alphanumeric (P3528250B) or numeric only (583889747)
  const passengerPattern = /\d+\s+[A-Z]{3}\s+[A-Z]{3}\s+([A-Z0-9]{5,7})\s+[\d\/]+\s+[\d\/]+\s+([A-Z]+)\s+([\w\s]+?)\s+(MR|MS|MISS|MISTER|MRS)\s+([A-Z]{2,3})\s+([\w\d]+)\s+([\d.]+)\s+([\d\/]+)\s+(\d+)\s+(ADT|CHD)/gi;
  
  const matches = [...textContent.matchAll(passengerPattern)];
  
  console.log(`📋 Name List: Found ${matches.length} passengers`);
  
  for (const match of matches) {
    const pnr = match[1];
    const surname = match[2].trim();
    const given = match[3].trim();
    const title = match[4].trim();
    const nationality = match[5];
    const passportNumber = match[6];
    const passportExpiry = match[7];
    const dateOfBirth = match[8];
    const age = parseInt(match[9]);
    const classification = match[10] as 'ADT' | 'CHD';
    
    // Normalize gender
    let gender: 'Mr' | 'Ms' | 'Mrs' | 'Miss';
    if (title === 'MR') {
      gender = 'Mr';
    } else if (title === 'MS') {
      gender = 'Ms';
    } else if (title === 'MISS') {
      gender = 'Miss';
    } else if (title === 'MISTER') {
      gender = 'Mr';
    } else if (title === 'MRS') {
      gender = 'Mrs';
    } else {
      gender = 'Ms'; // Default
    }
    
    result.passengers.push({
      surname,
      given,
      title,
      gender,
      classification,
      passportNumber,
      nationality,
      dateOfBirth,
      age
    });
    
    console.log(`✅ Parsed: ${surname} ${given} (${gender}, ${classification})`);
  }
  
  console.log(`📊 Total parsed from Name List: ${result.passengers.length}`);
  
  return result;
}

/**
 * Merge e-Ticket passengers with Name List data
 */
export function mergePassengerData(
  eTicketPassengers: Array<{ lastName: string; firstName: string; gender: string; passengerType?: string; ticketNumber?: string }>,
  nameListPassengers: Array<{ surname: string; given: string; gender: string; classification: string; passportNumber?: string }>
): Array<{ lastName: string; firstName: string; gender: string; passengerType?: string; ticketNumber?: string }> {
  
  if (!nameListPassengers || nameListPassengers.length === 0) {
    return eTicketPassengers;
  }
  
  console.log(`🔄 Merging: ${eTicketPassengers.length} e-ticket + ${nameListPassengers.length} name list`);
  
  // Use name list as primary source (more complete)
  const merged = nameListPassengers.map(nlp => ({
    lastName: nlp.surname,
    firstName: nlp.given,
    gender: nlp.gender,
    passengerType: nlp.classification === 'ADT' ? 'Adult' : 'Child',
    ticketNumber: ''
  }));
  
  console.log(`✅ Merged result: ${merged.length} passengers`);
  
  return merged;
}


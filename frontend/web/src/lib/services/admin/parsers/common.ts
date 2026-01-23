// Common utilities for all airline parsers

// Airport code to name mapping
export const AIRPORT_NAME_BY_CODE: Record<string, string> = {
  CEB: 'CEBU',
  ICN: 'INCHEON, SEOUL',
  CRK: 'CLARK',
  PUS: 'BUSAN',
  TAG: 'BOHOL',
  NRT: 'NARITA',
  MNL: 'MANILA',
  CJU: 'JEJU',
  TAE: 'DAEGU',
};

export function getAirportNameByCode(code: string): string {
  return AIRPORT_NAME_BY_CODE[code] || code;
}

// Date format conversion: '2024.10.27' -> '27 OCT 2024'
export function formatDateString(dateStr: string): string {
  const parts = dateStr.split('.');
  if (parts.length !== 3) return dateStr;
  
  const [year, month, day] = parts;
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthIndex = parseInt(month, 10) - 1;
  const monthName = months[monthIndex];
  
  return `${day} ${monthName} ${year}`;
}

// Terminal number determination (hardcoded mapping)
export function getTerminalNumber(departureCode: string, arrivalCode: string) {
  const terminalMap: Record<string, { departure: string; arrival: string }> = {
    'CEB-ICN': { departure: '2', arrival: '1' },
    'CEB-PUS': { departure: '2', arrival: '1' },
    'ICN-CEB': { departure: '1', arrival: '2' },
    'PUS-CEB': { departure: '1', arrival: '2' },
    'MNL-ICN': { departure: '3', arrival: '1' },
    'ICN-MNL': { departure: '1', arrival: '3' },
  };
  
  const key = `${departureCode}-${arrivalCode}`;
  return terminalMap[key] || { departure: '', arrival: '' };
}

// Capitalize first letter of each word
export function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// Month name to number mapping
export const MONTH_MAP: Record<string, string> = {
  'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
  'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
  'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
};

// Parse date from "04 jan 2026" format
export function parseDateDMY(dateStr: string): { day: string; month: string; year: string } | null {
  const pattern = /(\d{1,2})\s+([a-z]{3})\s+(\d{4})/i;
  const match = dateStr.match(pattern);
  
  if (!match) return null;
  
  const day = match[1].padStart(2, '0');
  const monthStr = match[2].toUpperCase();
  const year = match[3];
  
  return { day, month: monthStr, year };
}



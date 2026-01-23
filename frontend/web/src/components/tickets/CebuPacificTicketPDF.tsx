import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import type { AirlineTicket, TicketPassenger } from '@unik/shared/types';

// No custom fonts - use system defaults for stability

const styles = StyleSheet.create({
  page: {
    padding: '12 25',
    fontSize: 8,
    backgroundColor: '#ffffff',
    lineHeight: 1.2,
  },
  header: {
    marginBottom: 6,
  },
  logo: {
    width: 180,
    objectFit: 'contain',
    marginBottom: 3,
  },
  mainTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#333333',
    textAlign: 'right',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: '#0075ca',
    marginBottom: 5,
  },
  table: {
    width: '100%',
    border: '1pt solid #ddd',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderBottom: '1pt solid #ddd',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableRowBorder: {
    borderBottom: '1pt solid #ddd',
  },
  tableCell: {
    padding: 5,
    fontSize: 7,
  },
  tableCellBorder: {
    borderRight: '1pt solid #ddd',
  },
  bookingDetailCell: {
    width: '33.33%',
    padding: 5,
    borderRight: '1pt solid #ddd',
    backgroundColor: '#ffffff',
  },
  bookingDetailCellHighlight: {
    width: '33.33%',
    padding: 5,
    backgroundColor: '#FFEB3B',
  },
  label: {
    fontSize: 7,
    color: '#666666',
    marginBottom: 2,
  },
  value: {
    fontWeight: 700,
    color: '#333333',
  },
  flightIconCell: {
    width: 90,
    padding: 5,
    fontSize: 7,
  },
  flightNumber: {
    fontWeight: 700,
    color: '#0075ca',
    fontSize: 8,
  },
  flightLocation: {
    flex: 1,
    padding: 5,
  },
  locationName: {
    fontWeight: 700,
    marginBottom: 2,
    fontSize: 8,
  },
  locationDetail: {
    fontSize: 7,
    color: '#0075ca',
    marginBottom: 1,
  },
  locationTime: {
    fontSize: 7,
  },
  remindersBox: {
    fontSize: 7,
    lineHeight: 1.3,
    color: '#333333',
  },
  guestNameCell: {
    width: '35%',
    padding: 5,
  },
  guestFlightCell: {
    width: '25%',
    padding: 5,
  },
  guestAddonsCell: {
    width: '40%',
    padding: 5,
  },
  guestName: {
    fontWeight: 700,
    marginBottom: 2,
    fontSize: 8,
  },
  guestType: {
    fontSize: 7,
    color: '#666666',
  },
  guidelinesGrid: {
    fontSize: 6,
    lineHeight: 1.2,
  },
  guidelinesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  guidelinesColumn: {
    flex: 1,
  },
  guidelineItem: {
    marginBottom: 4,
  },
  guidelineItemSmall: {
    marginBottom: 4,
    fontSize: 5,
  },
  guidelineTitle: {
    fontWeight: 700,
    marginBottom: 1,
  },
  guidelineText: {
    color: '#333333',
  },
  footer: {
    marginTop: 8,
    paddingTop: 6,
    borderTop: '1pt solid #ddd',
    textAlign: 'center',
    fontSize: 6,
    color: '#666666',
    lineHeight: 1.3,
  },
  footerItem: {
    marginBottom: 2,
  },
});

interface CebuPacificTicketPDFProps {
  ticket: AirlineTicket;
  passenger: TicketPassenger;
}

// 날짜를 요일 포함 형식으로 변환
const formatDateWithDay = (dateStr: string) => {
  const months: Record<string, number> = {
    'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
    'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
  };
  const parts = dateStr.trim().split(' ');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = months[parts[1].toUpperCase()];
    const year = parseInt(parts[2]);
    const date = new Date(year, month, day);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day.toString().padStart(2, '0')} ${monthNames[month]} ${year}, ${dayNames[date.getDay()]}`;
  }
  return dateStr;
};

// 시간을 24시간제 + 12시간제 병기 형식으로 변환
const formatTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')} H (${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period})`;
};

const CebuPacificTicketPDF: React.FC<CebuPacificTicketPDFProps> = ({ ticket, passenger }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image 
            src="/5J.png" 
            style={styles.logo}
          />
          <Text style={styles.mainTitle}>ITINERARY RECEIPT</Text>
        </View>

        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.bookingDetailCell}>
                <Text style={styles.label}>Status:</Text>
                <Text style={styles.value}>CONFIRMED</Text>
              </View>
              <View style={styles.bookingDetailCell}>
                <Text style={styles.label}>Booking Date:</Text>
                <Text style={styles.value}>{ticket.bookingDate}</Text>
              </View>
              <View style={styles.bookingDetailCellHighlight}>
                <Text style={styles.label}>Booking Reference:</Text>
                <Text style={styles.value}>{ticket.reservationNumber}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Flight Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Flight Details</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableCell, { width: 90 }]}>
                <Text style={styles.label}>Flight No./ Airline</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text style={styles.label}>Departure</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text style={styles.label}>Arrival</Text>
              </View>
            </View>

            {/* Flight Rows */}
            {ticket.journeys.map((journey, idx) => (
              <View key={idx} style={[styles.tableRow, idx < ticket.journeys.length - 1 ? styles.tableRowBorder : {}]}>
                <View style={[styles.flightIconCell, idx < ticket.journeys.length - 1 ? { borderBottom: '1pt solid #ddd' } : {}]}>
                  <Text style={styles.flightNumber}>{journey.flightNumber}</Text>
                </View>
                <View style={[styles.flightLocation, idx < ticket.journeys.length - 1 ? { borderBottom: '1pt solid #ddd' } : {}]}>
                  <Text style={styles.locationName}>
                    {journey.departureAirportCode === 'ICN' ? 'Seoul (ICN)' : 'Cebu (CEB)'}
                  </Text>
                  <Text style={styles.locationDetail}>
                    {journey.departureAirportName}
                    {journey.departureTerminal && ` - Terminal ${journey.departureTerminal}`}
                  </Text>
                  <Text style={styles.locationTime}>
                    {formatDateWithDay(journey.departureDate)} • {formatTime(journey.departureTime)}
                  </Text>
                </View>
                <View style={[styles.flightLocation, idx < ticket.journeys.length - 1 ? { borderBottom: '1pt solid #ddd' } : {}]}>
                  <Text style={styles.locationName}>
                    {journey.arrivalAirportCode === 'ICN' ? 'Seoul (ICN)' : 'Cebu (CEB)'}
                  </Text>
                  <Text style={styles.locationDetail}>
                    {journey.arrivalAirportName}
                    {journey.arrivalTerminal && ` - Terminal ${journey.arrivalTerminal}`}
                  </Text>
                  <Text style={styles.locationTime}>
                    {formatDateWithDay(journey.arrivalDate)} • {formatTime(journey.arrivalTime)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminders</Text>
          <View style={styles.remindersBox}>
            <Text>
              Guests booked on Cebu Pacific's interline partners may need to transfer airport terminals when transiting via Manila. 
              Please proceed to the transit area for the free Manila International Airport Authority shuttle service from 05:30 AM to 01:00 AM of the following day. 
              The MIAA shuttle leaves every 30 to 40 minutes.
            </Text>
          </View>
        </View>

        {/* Guest Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guest Details</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.guestNameCell, { borderBottom: 'none' }]}>
                <Text style={styles.label}>Name</Text>
              </View>
              <View style={[styles.guestFlightCell, { borderBottom: 'none' }]}>
                <Text style={styles.label}>Flight</Text>
              </View>
              <View style={[styles.guestAddonsCell, { borderBottom: 'none' }]}>
                <Text style={styles.label}>Add-ons</Text>
              </View>
            </View>

            {/* Guest Row */}
            <View style={styles.tableRow}>
              <View style={styles.guestNameCell}>
                <Text style={styles.guestName}>
                  {passenger.gender ? `${passenger.gender.toUpperCase()} ` : ''}{passenger.firstName.toUpperCase()} {passenger.lastName.toUpperCase()}
                </Text>
                <Text style={styles.guestType}>{passenger.type || 'Adult'}</Text>
              </View>
              <View style={styles.guestFlightCell}>
                {ticket.journeys.map((j, idx) => (
                  <Text key={idx} style={{ fontSize: 7, marginBottom: idx < ticket.journeys.length - 1 ? 2 : 0 }}>
                    {j.departureAirportCode} - {j.arrivalAirportCode}
                  </Text>
                ))}
              </View>
              <View style={styles.guestAddonsCell}>
                <Text style={{ fontSize: 7, marginBottom: 2 }}>
                  {ticket.journeys[0]?.bookingClass || 'GO Basic'}
                </Text>
                <Text style={styles.guestType}>Seat : Unassigned</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Check-in Guidelines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Check-in Guidelines</Text>
          <View style={styles.guidelinesGrid}>
            <View style={styles.guidelinesRow}>
              <View style={styles.guidelinesColumn}>
                <View style={styles.guidelineItem}>
                  <Text style={styles.guidelineTitle}>Booking Changes</Text>
                  <Text style={styles.guidelineText}>
                    Changes must be done more than 2 hours before the flight subject to penalties and fare difference.
                  </Text>
                </View>
                <View style={styles.guidelineItem}>
                  <Text style={styles.guidelineTitle}>Online check-in</Text>
                  <Text style={styles.guidelineText}>
                    Check in through the Cebu Pacific mobile app or website to get your seat number and boarding pass.
                  </Text>
                  <Text style={[styles.guidelineText, { marginTop: 2, fontSize: 5 }]}>
                    Mobile and web check-in options are available as early as 7 days before the flight. For domestic travel, you have until 1 hour before the flight to do your online check-in, and it's up to 4 hours before the flight for international travel.
                  </Text>
                </View>
                <View style={styles.guidelineItem}>
                  <Text style={styles.guidelineTitle}>Airport counters and boarding gates</Text>
                  <Text style={styles.guidelineText}>
                    Bag Drop and check-in counters open as early as 3 hours before your flight. Check-in and boarding times vary and depend on the airport of departure.
                  </Text>
                  <Text style={[styles.guidelineText, { marginTop: 2, fontSize: 5 }]}>
                    Counter and Bag Drop closure{'\n'}
                    Flights leaving Dubai, Macau, and Shanghai: 60 minutes before departure{'\n'}
                    All other flights: 45 minutes before departure{'\n'}
                    After check-in, you must be at your designated boarding gate 30 minutes before the scheduled time of departure.{'\n'}
                    Guests will not be allowed to take the flight after check-in counters and boarding gates close.{'\n'}
                    For guests with Interline itineraries, the Operating Carrier's check-in and boarding times apply.
                  </Text>
                </View>
                <View style={styles.guidelineItem}>
                  <Text style={styles.guidelineTitle}>Valid Photo ID</Text>
                  <Text style={styles.guidelineText}>
                    For guests with Interline itineraries, the Operating Carrier's check-in and boarding times apply.
                  </Text>
                </View>
                <View>
                  <Text style={styles.guidelineTitle}>Prepaid Baggage</Text>
                  <Text style={styles.guidelineText}>
                    Purchase Prepaid Baggage up to 2 hours before your flight.
                  </Text>
                  <Text style={[styles.guidelineText, { marginTop: 2, fontSize: 5 }]}>
                    Bags for check-in must not exceed 30 kilos per piece, and not contain fragile or valuable items. You may carry one item inside the aircraft cabin, provided it weighs 7 kilos or less.
                  </Text>
                </View>
              </View>

              {/* 오른쪽 열 */}
              <View style={styles.guidelinesColumn}>
                <View style={styles.guidelineItem}>
                  <Text style={styles.guidelineTitle}>Travel documents</Text>
                  <Text style={[styles.guidelineText, { fontSize: 5 }]}>
                    International travelers must present valid passports and applicable visas. Cebu Pacific is a point-to-point carrier so please ensure that you have all the necessary visas or documents required for entry to the destination indicated on your Cebu Pacific itinerary.
                  </Text>
                  <Text style={[styles.guidelineText, { marginTop: 2, fontSize: 5 }]}>
                    Those connecting via Dubai may avail of baggage transfer services 24 hours before arrival.
                  </Text>
                  <Text style={[styles.guidelineText, { marginTop: 2, fontSize: 5 }]}>
                    All passengers flying into Sydney must clear immigration upon arrival. Those who have onward connections to a third country will not be able to use transit facilities and cannot avail of the transit-without-visa privilege, regardless of their connecting time.
                  </Text>
                </View>
                <View style={styles.guidelineItem}>
                  <Text style={styles.guidelineTitle}>Philippine Travel Tax</Text>
                  <Text style={[styles.guidelineText, { fontSize: 5 }]}>
                    Philippine passport holders are required to pay for the Philippine Travel Tax amounting to Php1,620 when traveling internationally from the Philippines. For bookings made online or through the call center, you may pay through TIEZA (Tourism Infrastructure and Enterprise Zone Authority) website or at their booth on the day of travel.
                  </Text>
                </View>
                <View>
                  <Text style={styles.guidelineTitle}>Terms and Conditions</Text>
                  <Text style={[styles.guidelineText, { fontSize: 5 }]}>
                    You may view the full Cebu Pacific and Cebgo Terms and Conditions by going to https://www.cebupacificair.com/pages/plan-trip/conditions-of-carriage
                  </Text>
                  <Text style={[styles.guidelineText, { marginTop: 2, fontSize: 5 }]}>
                    and your Air Passenger Rights here: http://www.gov.ph/2012/12/10/dotc-dti-joint-administrative-order-no-1-s-2012
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Text>
              For full Terms and Conditions, visit: <Text style={{ fontWeight: 700 }}>www.cebupacificair.com</Text>
            </Text>
          </View>
          <View>
            <Text>Agent: {ticket.agentName}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default CebuPacificTicketPDF;

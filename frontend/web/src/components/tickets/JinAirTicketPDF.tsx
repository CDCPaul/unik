import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import type { AirlineTicket, FlightJourney } from '@unik/shared/types';

// Register fonts if needed
// Font.register({
//   family: 'NotoSans',
//   src: '/fonts/NotoSansKR-Regular.ttf'
// });

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: '15mm 20mm',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#000000',
  },
  logo: {
    height: 52,
    width: 'auto',
    marginBottom: 6,
    alignSelf: 'center',
  },
  headerBox: {
    backgroundColor: '#134f5c',
    color: '#FFFFFF',
    paddingTop: 5,
    paddingRight: 10,
    paddingBottom: 5,
    paddingLeft: 10,
    marginBottom: 8,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000000',
  },
  sectionContainer: {
    marginBottom: 8,
  },
  table: {
    width: '100%',
    border: '1pt solid #D1D5DB',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #D1D5DB',
  },
  tableRowLast: {
    flexDirection: 'row',
  },
  tableCellLabel: {
    backgroundColor: '#f2f2f2',
    paddingTop: 2,
    paddingRight: 6,
    paddingBottom: 2,
    paddingLeft: 6,
    borderRight: '1pt solid #D1D5DB',
    fontSize: 9,
    color: '#000000',
  },
  tableCellValue: {
    backgroundColor: '#ffffff',
    paddingTop: 2,
    paddingRight: 6,
    paddingBottom: 2,
    paddingLeft: 6,
    fontSize: 9,
    color: '#000000',
  },
  tableCellValueBordered: {
    backgroundColor: '#ffffff',
    paddingTop: 2,
    paddingRight: 6,
    paddingBottom: 2,
    paddingLeft: 6,
    borderRight: '1pt solid #D1D5DB',
    fontSize: 9,
    color: '#000000',
  },
  infoBox: {
    backgroundColor: '#134f5c',
    color: '#FFFFFF',
    paddingTop: 4,
    paddingRight: 10,
    paddingBottom: 4,
    paddingLeft: 10,
    marginBottom: 6,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 7,
    paddingTop: 4,
    paddingRight: 8,
    paddingBottom: 4,
    paddingLeft: 8,
    lineHeight: 1.3,
  },
  footer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 7,
    color: '#666666',
  },
  cebuLogo: {
    width: 50,
    height: 50,
    objectFit: 'contain',
  },
});

interface JinAirTicketPDFProps {
  ticket: AirlineTicket;
  passenger: {
    lastName: string;
    firstName: string;
    gender: string;
    ticketNumber?: string;
  };
}

export default function JinAirTicketPDF({ ticket, passenger }: JinAirTicketPDFProps) {
  const passengerFullName = `${passenger.lastName}, ${passenger.firstName}`;
  const journey1 = ticket.journeys[0];
  const journey2 = ticket.journeys[1];
  const isRoundTrip = ticket.journeyType === 'round-trip';
  const fareInfo = ticket.fareInformation;

  const splitDate = (dateStr: string) => {
    const parts = dateStr.split(' ');
    return {
      day: parts[0] || '',
      month: parts[1] || '',
      year: parts[2] || ''
    };
  };

  const issueDate = splitDate(ticket.bookingDate);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Logo */}
        <Image
          src="/JINAIR_LOGO.png"
          style={styles.logo}
        />

        {/* ELECTRONIC TICKET Header */}
        <View style={styles.headerBox}>
          <Text>ELECTRONIC TICKET</Text>
        </View>

        {/* Passenger Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Passenger Information</Text>
          
          <View style={styles.table}>
            {/* Passenger Name Row */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCellLabel, { width: '30%' }]}>
                <Text>Passenger Name</Text>
              </View>
              <View style={[styles.tableCellValueBordered, { width: '55%' }]}>
                <Text>{passengerFullName}</Text>
              </View>
              <View style={[styles.tableCellValue, { width: '15%', textAlign: 'center' }]}>
                <Text>{passenger.gender}</Text>
              </View>
            </View>

            {/* Booking Reference Row */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCellLabel, { width: '30%' }]}>
                <Text>Booking Reference</Text>
              </View>
              <View style={[styles.tableCellValue, { width: '70%' }]}>
                <Text>{ticket.reservationNumber}</Text>
              </View>
            </View>

            {/* Ticket Number Row */}
            {passenger.ticketNumber && (
              <View style={styles.tableRowLast}>
                <View style={[styles.tableCellLabel, { width: '30%' }]}>
                  <Text>Ticket Number</Text>
                </View>
                <View style={[styles.tableCellValue, { width: '70%' }]}>
                  <Text>{passenger.ticketNumber}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Itinerary */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Itinerary</Text>
          
          <View style={styles.table}>
            <FlightTablePDF journey={journey1} />
            {isRoundTrip && journey2 && <FlightTablePDF journey={journey2} />}
          </View>
        </View>

        {/* Fare Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Fare Information</Text>
          
          <View style={styles.table}>
            {/* Agent Name */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCellLabel, { width: '30%' }]}>
                <Text>Agent Name</Text>
              </View>
              <View style={[styles.tableCellValue, { width: '70%' }]}>
                <Text>{ticket.agentName}</Text>
              </View>
            </View>

            {/* Date of Issue */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCellLabel, { width: '30%' }]}>
                <Text>Date of Issue</Text>
              </View>
              <View style={[styles.tableCellValueBordered, { width: '15%', textAlign: 'center' }]}>
                <Text>{issueDate.day}</Text>
              </View>
              <View style={[styles.tableCellValueBordered, { width: '20%', textAlign: 'center' }]}>
                <Text>{issueDate.month}</Text>
              </View>
              <View style={[styles.tableCellValue, { width: '35%', textAlign: 'center' }]}>
                <Text>{issueDate.year}</Text>
              </View>
            </View>

            {/* Notes */}
            <View style={fareInfo?.formOfPayment ? styles.tableRow : styles.tableRowLast}>
              <View style={[styles.tableCellLabel, { width: '30%' }]}>
                <Text>Notes</Text>
              </View>
              <View style={[styles.tableCellValue, { width: '70%' }]}>
                <Text>{ticket.notes || ''}</Text>
              </View>
            </View>

            {/* Optional Fare Items */}
            {fareInfo?.formOfPayment && (
              <View style={fareInfo?.fareAmount?.value ? styles.tableRow : styles.tableRowLast}>
                <View style={[styles.tableCellLabel, { width: '30%' }]}>
                  <Text>Form of Payment</Text>
                </View>
                <View style={[styles.tableCellValue, { width: '70%' }]}>
                  <Text>{fareInfo.formOfPayment}</Text>
                </View>
              </View>
            )}

            {fareInfo?.fareAmount?.value && (
              <View style={fareInfo?.fuelSurcharge?.value ? styles.tableRow : styles.tableRowLast}>
                <View style={[styles.tableCellLabel, { width: '30%' }]}>
                  <Text>Fare Amount</Text>
                </View>
                <View style={[styles.tableCellValue, { width: '70%' }]}>
                  <Text>{fareInfo.fareAmount.currency} {fareInfo.fareAmount.value}</Text>
                </View>
              </View>
            )}

            {fareInfo?.fuelSurcharge?.value && (
              <View style={fareInfo?.tax?.value ? styles.tableRow : styles.tableRowLast}>
                <View style={[styles.tableCellLabel, { width: '30%' }]}>
                  <Text>Fuel Surcharge</Text>
                </View>
                <View style={[styles.tableCellValue, { width: '70%' }]}>
                  <Text>{fareInfo.fuelSurcharge.currency} {fareInfo.fuelSurcharge.value}</Text>
                </View>
              </View>
            )}

            {fareInfo?.tax?.value && (
              <View style={fareInfo?.changeFee?.value ? styles.tableRow : styles.tableRowLast}>
                <View style={[styles.tableCellLabel, { width: '30%' }]}>
                  <Text>Tax</Text>
                </View>
                <View style={[styles.tableCellValue, { width: '70%' }]}>
                  <Text>{fareInfo.tax.currency} {fareInfo.tax.value}</Text>
                </View>
              </View>
            )}

            {fareInfo?.changeFee?.value && (
              <View style={fareInfo?.totalAmount?.value ? styles.tableRow : styles.tableRowLast}>
                <View style={[styles.tableCellLabel, { width: '30%' }]}>
                  <Text>Change Fee</Text>
                </View>
                <View style={[styles.tableCellValue, { width: '70%' }]}>
                  <Text>{fareInfo.changeFee.currency} {fareInfo.changeFee.value}</Text>
                </View>
              </View>
            )}

            {fareInfo?.totalAmount?.value && (
              <View style={styles.tableRowLast}>
                <View style={[styles.tableCellLabel, { width: '30%' }]}>
                  <Text>Total Amount</Text>
                </View>
                <View style={[styles.tableCellValue, { width: '70%' }]}>
                  <Text>{fareInfo.totalAmount.currency} {fareInfo.totalAmount.value}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* INFORMATION Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.infoBox}>
            <Text>INFORMATION</Text>
          </View>
          <View style={styles.infoText}>
            <Text>• Please refer to the legal notice which has been linked to this ITR.</Text>
            <Text>• Please carry this ITR throughout your journey. Name in this ITR must match with the name in the passport.</Text>
            <Text>• In case of not carrying travel documents required, flight boarding or entering the country may be refused.</Text>
            <Text>• If you paid by credit card with non-verification method when purchasing flight tickets, the cardholder must present his/her payment card when checking-in at the airport.</Text>
            <Text>• Check in is closed 50 minutes before the flight departure. Please arrive the airport 2 hours before scheduled departure time.</Text>
            <Text>• Flight coupons or electronic coupons must be used in sequence from the origin place of departure as shown on the ticket.</Text>
            <Text>• ITR is merely a document for information and does not grant the possessor any legal rights regarding concerned carriage.</Text>
            <Text>• Carriage or other services provided by the airline will be applied in accordance with the Conditions of Carriage.</Text>
            <Text>• Please refer to the legal notice before the journey.</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerText}>
            <Text>ticket@cebu-jinair.com</Text>
            <Text>0917-186-8666 / 032-234-8666</Text>
            <Text>Cebu Direct Club Phil. Travel & Tours Inc.</Text>
          </View>
          <Image
            src="/cebu-direct-logo.jpg"
            style={styles.cebuLogo}
          />
        </View>
      </Page>
    </Document>
  );
}

interface FlightTablePDFProps {
  journey: FlightJourney;
}

function FlightTablePDF({ journey }: FlightTablePDFProps) {
  const splitDate = (dateStr: string) => {
    const parts = dateStr.split(' ');
    return {
      day: parts[0] || '',
      month: parts[1] || '',
      year: parts[2] || ''
    };
  };

  const depDate = splitDate(journey.departureDate);
  const arrDate = splitDate(journey.arrivalDate);
  const notValidBeforeDate = splitDate(journey.notValidBefore || '');
  const notValidAfterDate = splitDate(journey.notValidAfter || '');

  return (
    <View>
      {/* Flight Number */}
      <View style={styles.tableRow}>
        <View style={[styles.tableCellLabel, { width: '30%' }]}>
          <Text>Flight No.</Text>
        </View>
        <View style={[styles.tableCellValue, { width: '70%' }]}>
          <Text>{journey.flightNumber}</Text>
        </View>
      </View>

      {/* Departure */}
      <View style={styles.tableRow}>
        <View style={[styles.tableCellLabel, { width: '30%' }]}>
          <Text>Departure</Text>
        </View>
        <View style={[styles.tableCellValueBordered, { width: '10%' }]}>
          <Text>{journey.departureAirportCode}</Text>
        </View>
        <View style={[styles.tableCellValueBordered, { width: '7%', textAlign: 'center' }]}>
          <Text>{depDate.day}</Text>
        </View>
        <View style={[styles.tableCellValueBordered, { width: '10%', textAlign: 'center' }]}>
          <Text>{depDate.month}</Text>
        </View>
        <View style={[styles.tableCellValueBordered, { width: '10%', textAlign: 'center' }]}>
          <Text>{depDate.year}</Text>
        </View>
        <View style={[styles.tableCellValueBordered, { width: '10%', textAlign: 'center' }]}>
          <Text>{journey.departureTime}</Text>
        </View>
        <View style={[styles.tableCellLabel, { width: '13%', textAlign: 'center' }]}>
          <Text>Terminal</Text>
        </View>
        <View style={[styles.tableCellValue, { width: '10%', textAlign: 'center' }]}>
          <Text>{journey.departureTerminal || ''}</Text>
        </View>
      </View>

      {/* Arrival */}
      <View style={styles.tableRow}>
        <View style={[styles.tableCellLabel, { width: '30%' }]}>
          <Text>Arrival</Text>
        </View>
        <View style={[styles.tableCellValueBordered, { width: '10%' }]}>
          <Text>{journey.arrivalAirportCode}</Text>
        </View>
        <View style={[styles.tableCellValueBordered, { width: '7%', textAlign: 'center' }]}>
          <Text>{arrDate.day}</Text>
        </View>
        <View style={[styles.tableCellValueBordered, { width: '10%', textAlign: 'center' }]}>
          <Text>{arrDate.month}</Text>
        </View>
        <View style={[styles.tableCellValueBordered, { width: '10%', textAlign: 'center' }]}>
          <Text>{arrDate.year}</Text>
        </View>
        <View style={[styles.tableCellValueBordered, { width: '10%', textAlign: 'center' }]}>
          <Text>{journey.arrivalTime}</Text>
        </View>
        <View style={[styles.tableCellLabel, { width: '13%', textAlign: 'center' }]}>
          <Text>Terminal</Text>
        </View>
        <View style={[styles.tableCellValue, { width: '10%', textAlign: 'center' }]}>
          <Text>{journey.arrivalTerminal || ''}</Text>
        </View>
      </View>

      {/* Booking Class & Not Valid Before */}
      <View style={styles.tableRow}>
        <View style={[styles.tableCellLabel, { width: '30%' }]}>
          <Text>Booking Class</Text>
        </View>
        <View style={[styles.tableCellValueBordered, { width: '15%' }]}>
          <Text>{journey.bookingClass}</Text>
        </View>
        <View style={[styles.tableCellLabel, { width: '20%' }]}>
          <Text>Not Valid Before</Text>
        </View>
        <View style={[styles.tableCellValue, { width: '35%', textAlign: 'center' }]}>
          <Text>{notValidBeforeDate.day} {notValidBeforeDate.month} {notValidBeforeDate.year}</Text>
        </View>
      </View>

      {/* Booking Status & Not Valid After */}
      <View style={styles.tableRow}>
        <View style={[styles.tableCellLabel, { width: '30%' }]}>
          <Text>Booking Status</Text>
        </View>
        <View style={[styles.tableCellValueBordered, { width: '15%' }]}>
          <Text>HK</Text>
        </View>
        <View style={[styles.tableCellLabel, { width: '20%' }]}>
          <Text>Not Valid After</Text>
        </View>
        <View style={[styles.tableCellValue, { width: '35%', textAlign: 'center' }]}>
          <Text>{notValidAfterDate.day} {notValidAfterDate.month} {notValidAfterDate.year}</Text>
        </View>
      </View>

      {/* Seats & Free Baggage */}
      <View style={styles.tableRow}>
        <View style={[styles.tableCellLabel, { width: '30%' }]}>
          <Text>Seats</Text>
        </View>
        <View style={[styles.tableCellValueBordered, { width: '15%' }]}>
          <Text></Text>
        </View>
        <View style={[styles.tableCellLabel, { width: '20%' }]}>
          <Text>Free Baggage</Text>
        </View>
        <View style={[styles.tableCellValue, { width: '35%', textAlign: 'center' }]}>
          <Text>Total {journey.baggageAllowance || ''}</Text>
        </View>
      </View>
    </View>
  );
}


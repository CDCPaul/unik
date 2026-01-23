import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { AirlineTicket, TicketPassenger } from '@unik/shared/types';

interface AirBusanTicketPDFProps {
  ticket: AirlineTicket;
  passenger: TicketPassenger;
}

const styles = StyleSheet.create({
  page: {
    padding: '10mm',
    fontSize: 8,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    borderBottom: '2pt solid #000',
    paddingBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  label: {
    fontWeight: 'bold',
  },
  table: {
    marginBottom: 8,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderTop: '2pt solid #3957a8',
    borderBottom: '2pt solid #3957a8',
    paddingVertical: 4,
  },
  tableHeaderCell: {
    fontSize: 7,
    color: '#000',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  tableRowDashed: {
    flexDirection: 'row',
    borderBottom: '1pt dashed #3957a8',
    paddingVertical: 3,
  },
  tableRowSolid: {
    flexDirection: 'row',
    borderBottom: '1pt solid #3957a8',
    paddingVertical: 3,
  },
  tableCell: {
    padding: 3,
    fontSize: 7,
  },
  flightNumberRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  flightNumberText: {
    fontWeight: 'bold',
    fontSize: 7,
    color: '#000',
  },
  fareTable: {
    marginBottom: 8,
  },
  fareRowDashed: {
    flexDirection: 'row',
    borderBottom: '1pt dashed #3957a8',
    paddingVertical: 3,
  },
  fareRowSolid: {
    flexDirection: 'row',
    borderBottom: '2pt solid #3957a8',
    paddingVertical: 3,
  },
  fareRowTop: {
    flexDirection: 'row',
    borderTop: '2pt solid #3957a8',
    borderBottom: '1pt dashed #3957a8',
    paddingVertical: 3,
  },
  fareLabel: {
    width: '30%',
    padding: 3,
    fontWeight: 'bold',
    fontSize: 7,
  },
  fareValue: {
    width: '70%',
    padding: 3,
    fontSize: 7,
  },
  footer: {
    fontSize: 5.5,
    lineHeight: 1.3,
    color: '#333',
    marginTop: 6,
  },
  footerText: {
    marginBottom: 2,
  },
});

export default function AirBusanTicketPDF({ ticket, passenger }: AirBusanTicketPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>E-Ticket Passenger Itinerary</Text>
          
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row' }}>
              <Text style={styles.label}>Passenger Name</Text>
              <Text style={{ marginLeft: 20 }}>
                {passenger.lastName.toUpperCase()}/{passenger.firstName.toUpperCase()} {passenger.gender.toUpperCase()}
              </Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={styles.label}>Reservation No.</Text>
              <Text style={{ marginLeft: 10 }}>{ticket.reservationNumber}</Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.label}>E-Ticket No.</Text>
            <Text style={{ marginLeft: 20 }}>{passenger.ticketNumber || '-'}</Text>
          </View>
        </View>

        {/* Journey Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { width: '22%' }]}>City(Airport)</Text>
            <Text style={[styles.tableHeaderCell, { width: '18%' }]}>Date(Day)</Text>
            <Text style={[styles.tableHeaderCell, { width: '13%' }]}>Local Time</Text>
            <Text style={[styles.tableHeaderCell, { width: '11%' }]}>Terminal</Text>
            <Text style={[styles.tableHeaderCell, { width: '16%' }]}>Flighting Time</Text>
            <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Status</Text>
          </View>
          
          {/* Journey Rows */}
          {ticket.journeys.map((journey, index) => (
            <React.Fragment key={index}>
              {/* Flight Number */}
              <View style={styles.flightNumberRow}>
                <Text style={styles.flightNumberText}>
                  {index + 1}. {journey.flightNumber}
                </Text>
              </View>
              
              {/* Departure */}
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '22%', fontWeight: 'bold' }]}>Departure</Text>
                <Text style={[styles.tableCell, { width: '18%' }]}>
                  {journey.departureAirportName} ({journey.departureAirportCode})
                </Text>
                <Text style={[styles.tableCell, { width: '13%' }]}>{journey.departureDate}</Text>
                <Text style={[styles.tableCell, { width: '11%' }]}>{journey.departureTime}</Text>
                <Text style={[styles.tableCell, { width: '16%' }]}>{journey.departureTerminal || '-'}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>OK</Text>
              </View>
              
              {/* Arrival */}
              <View style={styles.tableRowDashed}>
                <Text style={[styles.tableCell, { width: '22%', fontWeight: 'bold' }]}>Arrival</Text>
                <Text style={[styles.tableCell, { width: '18%' }]}>
                  {journey.arrivalAirportName} ({journey.arrivalAirportCode})
                </Text>
                <Text style={[styles.tableCell, { width: '13%' }]}>{journey.arrivalDate}</Text>
                <Text style={[styles.tableCell, { width: '11%' }]}>{journey.arrivalTime}</Text>
                <Text style={[styles.tableCell, { width: '16%' }]}>{journey.arrivalTerminal || '-'}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>OK</Text>
              </View>
              
              {/* Additional Info 1 */}
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '51%', fontSize: 7 }]}>
                  {journey.flightNumber} is operated by AIR BUSAN
                </Text>
                <Text style={[styles.tableCell, { width: '29%', fontSize: 7 }]}>Booking Class</Text>
                <Text style={[styles.tableCell, { width: '20%', fontSize: 7 }]}>
                  {journey.bookingClass}
                </Text>
              </View>
              
              {/* Additional Info 2 */}
              <View style={styles.tableRowDashed}>
                <Text style={[styles.tableCell, { width: '51%', fontSize: 7 }]}>
                  Free baggage allowance - Baggage Allowance is {journey.baggageAllowance}
                </Text>
                <Text style={[styles.tableCell, { width: '29%', fontSize: 7 }]}>Fare Basis</Text>
                <Text style={[styles.tableCell, { width: '20%', fontSize: 7 }]}>-</Text>
              </View>
              
              {/* Via Row */}
              <View style={index === ticket.journeys.length - 1 ? styles.tableRowSolid : styles.tableRowDashed}>
                <Text style={[styles.tableCell, { width: '80%' }]}></Text>
                <Text style={[styles.tableCell, { width: '20%', fontSize: 7 }]}>Via</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Fare Information Table */}
        <View style={styles.fareTable}>
          <View style={styles.fareRowTop}>
            <Text style={styles.fareLabel}>Restrictions</Text>
            <Text style={styles.fareValue}></Text>
          </View>
          <View style={styles.fareRowDashed}>
            <Text style={styles.fareLabel}>Date/Place</Text>
            <Text style={styles.fareValue}></Text>
          </View>
          <View style={styles.fareRowDashed}>
            <Text style={styles.fareLabel}>Fare Calculation</Text>
            <Text style={styles.fareValue}></Text>
          </View>
          <View style={styles.fareRowDashed}>
            <Text style={styles.fareLabel}>Fare</Text>
            <Text style={styles.fareValue}>Equivalent</Text>
          </View>
          <View style={styles.fareRowDashed}>
            <Text style={styles.fareLabel}>Fuel Surcharge</Text>
            <Text style={styles.fareValue}></Text>
          </View>
          <View style={styles.fareRowDashed}>
            <Text style={styles.fareLabel}>Tax/Fee</Text>
            <Text style={styles.fareValue}></Text>
          </View>
          <View style={styles.fareRowDashed}>
            <Text style={styles.fareLabel}>Total</Text>
            <Text style={styles.fareValue}>Original Issue</Text>
          </View>
          <View style={styles.fareRowDashed}>
            <Text style={styles.fareLabel}>Form of Payment</Text>
            <Text style={styles.fareValue}>Tour Code</Text>
          </View>
          <View style={styles.fareRowDashed}>
            <Text style={styles.fareLabel}>Issued in Exchange for</Text>
            <Text style={styles.fareValue}></Text>
          </View>
          <View style={styles.fareRowSolid}>
            <Text style={styles.fareLabel}>Conjunction Tickets</Text>
            <Text style={styles.fareValue}></Text>
          </View>
        </View>

        {/* Footer Notes */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            - The check-in process for international flights will be available from 2 hours (In case of departure from Incheon, from 2 hours and 30 minutes ago) and up to 50 minutes before your flight's scheduled departure time. Please arrive at the airport 2 hours before your flight to ensure a smooth check-in.
          </Text>
          <Text style={styles.footerText}>
            - Check-in time might be changed depending on the airport's circumstance.
          </Text>
          <Text style={styles.footerText}>
            - E-Ticket Passenger Itinerary must be presented to immigration/customs if required. Please carry this E-Ticket Passenger Itinerary with you during your travel.
          </Text>
          <Text style={styles.footerText}>
            - Your English name as it appears on your E-Ticket Passenger Itinerary must match the name on your passport.
          </Text>
          <Text style={styles.footerText}>
            - Airline tickets must be used in order, starting from the flight's origin specified on the airline tickets.
          </Text>
          <Text style={styles.footerText}>
            - If the limit on free baggage (weight/number) is exceeded, the excess baggage charge will be imposed. The charges vary depending on the routes.
          </Text>
          <Text style={styles.footerText}>
            - Unused ticket after departure is possible to refund through Reservation Center where only you purchased of a ticket in the country, the refund amount is subject in accordance to fare rules.
          </Text>
          <Text style={styles.footerText}>
            - Restrictions such as if a visa is necessary or expiry date of passport are different from each country. AIR BUSAN has no responsibility on arrival visa, passport or travel information. Please make sure to check relevant information by each country's embassy or consulate before ticket issuance.
          </Text>
          <Text style={styles.footerText}>
            - The flight fare above is initial price, not same as your amount paid. If you want to check your amount paid, please contact the location of purchase.
          </Text>
        </View>
      </Page>
    </Document>
  );
}


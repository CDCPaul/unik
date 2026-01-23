import React from 'react';
import type { AirlineTicket, TicketPassenger } from '@unik/shared/types';

interface AirBusanTicketProps {
  ticket: AirlineTicket;
  passenger: TicketPassenger;
}

export default function AirBusanTicket({ ticket, passenger }: AirBusanTicketProps) {
  return (
    <div style={{
      width: '210mm',
      minHeight: '297mm',
      margin: '0 auto',
      padding: '20mm',
      backgroundColor: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      lineHeight: '1.4',
      color: '#000000'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          marginBottom: '15px',
          borderBottom: '2px solid #000',
          paddingBottom: '8px'
        }}>
          E-Ticket Passenger Itinerary
        </h1>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <div>
            <span style={{ fontWeight: 'bold' }}>Passenger Name</span>
            <span style={{ marginLeft: '40px' }}>
              {passenger.lastName.toUpperCase()}/{passenger.firstName.toUpperCase()} {passenger.gender.toUpperCase()}
            </span>
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Reservation No.</span>
            <span style={{ marginLeft: '20px' }}>{ticket.reservationNumber}</span>
          </div>
        </div>
        
        <div>
          <span style={{ fontWeight: 'bold' }}>E-Ticket No.</span>
          <span style={{ marginLeft: '40px' }}>{passenger.ticketNumber || '-'}</span>
        </div>
      </div>

      {/* Journey Information */}
      <div style={{ marginBottom: '15px' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '10px'
        }}>
          <thead>
            <tr style={{ borderTop: '2px solid #3957a8', borderBottom: '2px solid #3957a8' }}>
              <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 'bold', color: '#000' }}>City(Airport)</th>
              <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 'bold', color: '#000' }}>Date(Day)</th>
              <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 'bold', color: '#000' }}>Local Time</th>
              <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 'bold', color: '#000' }}>Terminal</th>
              <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 'bold', color: '#000' }}>Flighting Time</th>
              <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 'bold', color: '#000' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {ticket.journeys.map((journey, index) => (
              <React.Fragment key={index}>
                {/* Flight Number */}
                <tr>
                  <td colSpan={6} style={{ 
                    padding: '8px 6px',
                    fontWeight: 'bold',
                    color: '#000'
                  }}>
                    {index + 1}. {journey.flightNumber}
                  </td>
                </tr>
                
                {/* Departure */}
                <tr>
                  <td style={{ padding: '6px' }}>
                    <strong>Departure</strong>
                  </td>
                  <td style={{ padding: '6px' }}>
                    {journey.departureAirportName} ({journey.departureAirportCode})
                  </td>
                  <td style={{ padding: '6px' }}>
                    {journey.departureDate}
                  </td>
                  <td style={{ padding: '6px' }}>
                    {journey.departureTime}
                  </td>
                  <td style={{ padding: '6px' }}>
                    {journey.departureTerminal || '-'}
                  </td>
                  <td style={{ padding: '6px' }}>
                    OK
                  </td>
                </tr>
                
                {/* Arrival */}
                <tr style={{ borderBottom: '1px dashed #3957a8' }}>
                  <td style={{ padding: '6px' }}>
                    <strong>Arrival</strong>
                  </td>
                  <td style={{ padding: '6px' }}>
                    {journey.arrivalAirportName} ({journey.arrivalAirportCode})
                  </td>
                  <td style={{ padding: '6px' }}>
                    {journey.arrivalDate}
                  </td>
                  <td style={{ padding: '6px' }}>
                    {journey.arrivalTime}
                  </td>
                  <td style={{ padding: '6px' }}>
                    {journey.arrivalTerminal || '-'}
                  </td>
                  <td style={{ padding: '6px' }}>
                    OK
                  </td>
                </tr>
                
                {/* Additional Info */}
                <tr>
                  <td colSpan={3} style={{ padding: '6px', fontSize: '9px' }}>
                    {journey.flightNumber} is operated by AIR BUSAN
                  </td>
                  <td colSpan={2} style={{ padding: '6px', fontSize: '9px' }}>
                    Booking Class
                  </td>
                  <td style={{ padding: '6px', fontSize: '9px' }}>
                    {journey.bookingClass}
                  </td>
                </tr>
                
                <tr style={{ borderBottom: '1px dashed #3957a8' }}>
                  <td colSpan={3} style={{ padding: '6px', fontSize: '9px' }}>
                    <strong>Free baggage allowance</strong> - Baggage Allowance is {journey.baggageAllowance}
                  </td>
                  <td colSpan={2} style={{ padding: '6px', fontSize: '9px' }}>
                    Fare Basis
                  </td>
                  <td style={{ padding: '6px', fontSize: '9px' }}>
                    -
                  </td>
                </tr>
                
                <tr style={{ borderBottom: index === ticket.journeys.length - 1 ? '2px solid #3957a8' : '1px dashed #3957a8' }}>
                  <td colSpan={5} style={{ padding: '6px', fontSize: '9px' }}></td>
                  <td style={{ padding: '6px', fontSize: '9px' }}>Via</td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fare Information */}
      <div style={{ marginBottom: '15px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <tbody>
            <tr style={{ borderTop: '2px solid #3957a8', borderBottom: '1px dashed #3957a8' }}>
              <td style={{ padding: '6px', width: '30%', fontWeight: 'bold' }}>
                Restrictions
              </td>
              <td style={{ padding: '6px' }}></td>
            </tr>
            <tr style={{ borderBottom: '1px dashed #3957a8' }}>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>Date/Place</td>
              <td style={{ padding: '6px' }}></td>
            </tr>
            <tr style={{ borderBottom: '1px dashed #3957a8' }}>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>Fare Calculation</td>
              <td style={{ padding: '6px' }}></td>
            </tr>
            <tr style={{ borderBottom: '1px dashed #3957a8' }}>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>Fare</td>
              <td style={{ padding: '6px' }}>Equivalent</td>
            </tr>
            <tr style={{ borderBottom: '1px dashed #3957a8' }}>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>Fuel Surcharge</td>
              <td style={{ padding: '6px' }}></td>
            </tr>
            <tr style={{ borderBottom: '1px dashed #3957a8' }}>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>Tax/Fee</td>
              <td style={{ padding: '6px' }}></td>
            </tr>
            <tr style={{ borderBottom: '1px dashed #3957a8' }}>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>Total</td>
              <td style={{ padding: '6px' }}>Original Issue</td>
            </tr>
            <tr style={{ borderBottom: '1px dashed #3957a8' }}>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>Form of Payment</td>
              <td style={{ padding: '6px' }}>Tour Code</td>
            </tr>
            <tr style={{ borderBottom: '1px dashed #3957a8' }}>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>Issued in Exchange for</td>
              <td style={{ padding: '6px' }}></td>
            </tr>
            <tr style={{ borderBottom: '2px solid #3957a8' }}>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>Conjunction Tickets</td>
              <td style={{ padding: '6px' }}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Notes */}
      <div style={{ 
        fontSize: '8px', 
        lineHeight: '1.5',
        color: '#333',
        marginTop: '15px'
      }}>
        <p style={{ marginBottom: '5px' }}>
          - The check-in process for international flights will be available from 2 hours (In case of departure from Incheon, from 2 hours and 30 minutes ago) and up to 50 minutes before your flight's scheduled departure time. Please arrive at the airport 2 hours before your flight to ensure a smooth check-in.
        </p>
        <p style={{ marginBottom: '5px' }}>
          - Check-in time might be changed depending on the airport's circumstance.
        </p>
        <p style={{ marginBottom: '5px' }}>
          - E-Ticket Passenger Itinerary must be presented to immigration/customs if required. Please carry this E-Ticket Passenger Itinerary with you during your travel.
        </p>
        <p style={{ marginBottom: '5px' }}>
          - Your English name as it appears on your E-Ticket Passenger Itinerary must match the name on your passport.
        </p>
        <p style={{ marginBottom: '5px' }}>
          - Airline tickets must be used in order, starting from the flight's origin specified on the airline tickets.
        </p>
        <p style={{ marginBottom: '5px' }}>
          - If the limit on free baggage (weight/number) is exceeded, the excess baggage charge will be imposed. The charges vary depending on the routes.
        </p>
        <p style={{ marginBottom: '5px' }}>
          - Unused ticket after departure is possible to refund through Reservation Center where only you purchased of a ticket in the country, the refund amount is subject in accordance to fare rules.
        </p>
        <p style={{ marginBottom: '5px' }}>
          - Restrictions such as if a visa is necessary or expiry date of passport are different from each country. AIR BUSAN has no responsibility on arrival visa, passport or travel information. Please make sure to check relevant information by each country's embassy or consulate before ticket issuance.
        </p>
        <p style={{ marginBottom: '5px' }}>
          - The flight fare above is initial price, not same as your amount paid. If you want to check your amount paid, please contact the location of purchase.
        </p>
      </div>
    </div>
  );
}


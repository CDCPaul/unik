import React from 'react';
import type { AirlineTicket } from '@unik/shared/types';

interface JinAirTicketProps {
  ticket: AirlineTicket;
  passenger: {
    lastName: string;
    firstName: string;
    gender: string;
    ticketNumber?: string;
  };
}

export default function JinAirTicket({ ticket, passenger }: JinAirTicketProps) {
  const passengerFullName = `${passenger.lastName}, ${passenger.firstName}`;
  const journey1 = ticket.journeys[0];
  const journey2 = ticket.journeys[1];
  const isRoundTrip = ticket.journeyType === 'round-trip';
  const fareInfo = ticket.fareInformation;

  return (
    <div style={{ 
      width: '210mm',
      minHeight: '297mm',
      backgroundColor: '#ffffff',
      padding: '15mm 20mm',
      fontFamily: 'Arial, sans-serif',
      fontSize: '9pt',
      color: '#000000',
      boxSizing: 'border-box',
      lineHeight: '1.4'
    }}>
      {/* Logo - 중앙 정렬 */}
      <div style={{ marginBottom: '6pt', textAlign: 'center' }}>
        <img
          src="/JINAIR_LOGO.png"
          alt="JINAIR"
          style={{
            height: '52px',
            objectFit: 'contain'
          }}
        />
      </div>

      {/* ELECTRONIC TICKET Header - 청록색, 중앙 정렬 */}
      <div style={{ 
        backgroundColor: '#134f5c',
        color: '#FFFFFF',
        padding: '5pt 10pt 5pt 10pt',
        marginBottom: '8pt',
        fontSize: '10pt',
        fontWeight: 'bold',
        letterSpacing: '1px',
        textAlign: 'center'
      }}>
        ELECTRONIC TICKET
      </div>

      {/* Passenger Information Section */}
      <div style={{ marginBottom: '8pt' }}>
        <h2 style={{ 
          fontSize: '9pt', 
          fontWeight: 'bold', 
          margin: '0 0 4pt 0',
          color: '#000000'
        }}>
          Passenger Information
        </h2>
        
        <table style={{ 
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '9pt',
          border: '1pt solid #D1D5DB'
        }}>
          <tbody>
            <tr style={{ borderBottom: '1pt solid #D1D5DB' }}>
              <td style={{ 
                width: '30%',
                padding: '2pt 6pt 2pt 6pt',
                fontWeight: 'normal',
                backgroundColor: '#f2f2f2',
                color: '#000000',
                borderRight: '1pt solid #D1D5DB'
              }}>
                Passenger Name
              </td>
              <td style={{ 
                width: '55%',
                padding: '2pt 6pt 2pt 6pt',
                backgroundColor: '#ffffff',
                color: '#000000',
                borderRight: '1pt solid #D1D5DB'
              }}>
                {passengerFullName}
              </td>
              <td style={{ 
                width: '15%',
                padding: '2pt 6pt 2pt 6pt',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                color: '#000000'
              }}>
                {passenger.gender}
              </td>
            </tr>
            <tr style={{ borderBottom: '1pt solid #D1D5DB' }}>
              <td style={{ 
                padding: '2pt 6pt 2pt 6pt',
                fontWeight: 'normal',
                backgroundColor: '#f2f2f2',
                color: '#000000',
                borderRight: '1pt solid #D1D5DB'
              }}>
                Booking Reference
              </td>
              <td colSpan={2} style={{ 
                padding: '2pt 6pt 2pt 6pt',
                backgroundColor: '#ffffff',
                color: '#000000'
              }}>
                {ticket.reservationNumber}
              </td>
            </tr>
            {passenger.ticketNumber && (
              <tr>
                <td style={{ 
                  padding: '2pt 6pt 2pt 6pt',
                  fontWeight: 'normal',
                  backgroundColor: '#f2f2f2',
                  color: '#000000',
                  borderRight: '1pt solid #D1D5DB'
                }}>
                  Ticket Number
                </td>
                <td colSpan={2} style={{ 
                  padding: '2pt 6pt 2pt 6pt',
                  backgroundColor: '#ffffff',
                  color: '#000000'
                }}>
                  {passenger.ticketNumber}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Itinerary Section */}
      <div style={{ marginBottom: '8pt' }}>
        <h2 style={{ 
          fontSize: '9pt', 
          fontWeight: 'bold', 
          margin: '0 0 4pt 0',
          color: '#000000'
        }}>
          Itinerary
        </h2>
        
        <FlightTable journey={journey1} />
        
        {isRoundTrip && journey2 && (
          <FlightTable journey={journey2} />
        )}
      </div>

      {/* Notice */}
      <div style={{ 
        marginBottom: '12pt',
        fontSize: '7.5pt',
        color: '#555555',
        fontStyle: 'italic'
      }}>
        - Schedules and aircraft type maybe changed without prior notice.
      </div>

      {/* Fare Information Section */}
      <div style={{ marginBottom: '8pt' }}>
        <h2 style={{ 
          fontSize: '9pt', 
          fontWeight: 'bold', 
          margin: '0 0 4pt 0',
          color: '#000000'
        }}>
          Fare Information
        </h2>
        
        <table style={{ 
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '9pt',
          border: '1pt solid #D1D5DB'
        }}>
          <tbody>
            <tr style={{ borderBottom: '1pt solid #D1D5DB' }}>
              <td style={{ 
                width: '30%',
                padding: '2pt 6pt 2pt 6pt',
                fontWeight: 'normal',
                backgroundColor: '#f2f2f2',
                color: '#000000',
                borderRight: '1pt solid #D1D5DB'
              }}>
                Agent Name
              </td>
              <td colSpan={3} style={{ 
                padding: '2pt 6pt 2pt 6pt',
                backgroundColor: '#ffffff',
                color: '#000000'
              }}>
                {ticket.agentName}
              </td>
            </tr>
            <tr style={{ borderBottom: '1pt solid #D1D5DB' }}>
              <td style={{ 
                padding: '2pt 6pt 2pt 6pt',
                fontWeight: 'normal',
                backgroundColor: '#f2f2f2',
                color: '#000000',
                borderRight: '1pt solid #D1D5DB'
              }}>
                Date of Issue
              </td>
              <td style={{ 
                width: '15%',
                padding: '2pt 6pt 2pt 6pt',
                textAlign: 'center',
                color: '#000000',
                backgroundColor: '#ffffff',
                borderRight: '1pt solid #D1D5DB'
              }}>
                {ticket.bookingDate.split(' ')[0]}
              </td>
              <td style={{ 
                width: '20%',
                padding: '2pt 6pt 2pt 6pt',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                color: '#000000',
                borderRight: '1pt solid #D1D5DB'
              }}>
                {ticket.bookingDate.split(' ')[1]}
              </td>
              <td style={{ 
                width: '35%',
                padding: '2pt 6pt 2pt 6pt',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                color: '#000000'
              }}>
                {ticket.bookingDate.split(' ')[2]}
              </td>
            </tr>
            <tr style={{ borderBottom: fareInfo?.formOfPayment ? '1pt solid #D1D5DB' : 'none' }}>
              <td style={{ 
                padding: '2pt 6pt 2pt 6pt',
                fontWeight: 'normal',
                backgroundColor: '#f2f2f2',
                color: '#000000',
                borderRight: '1pt solid #D1D5DB'
              }}>
                Notes
              </td>
              <td colSpan={3} style={{ 
                padding: '2pt 6pt 2pt 6pt',
                backgroundColor: '#ffffff',
                color: '#000000'
              }}>
                {ticket.notes || ''}
              </td>
            </tr>
            
            {/* Fare Information - Only show if data exists */}
            {fareInfo?.formOfPayment && (
              <tr style={{ borderBottom: fareInfo?.fareAmount?.value ? '1pt solid #D1D5DB' : 'none' }}>
                <td style={{ 
                  padding: '2pt 6pt 2pt 6pt',
                  fontWeight: 'normal',
                  backgroundColor: '#f2f2f2',
                  color: '#000000',
                  borderRight: '1pt solid #D1D5DB'
                }}>
                  Form of Payment
                </td>
                <td colSpan={3} style={{ 
                  padding: '2pt 6pt 2pt 6pt',
                  backgroundColor: '#ffffff',
                  color: '#000000'
                }}>
                  {fareInfo.formOfPayment}
                </td>
              </tr>
            )}
            {fareInfo?.fareAmount?.value && (
              <tr style={{ borderBottom: fareInfo?.fuelSurcharge?.value ? '1pt solid #D1D5DB' : 'none' }}>
                <td style={{ 
                  padding: '2pt 6pt 2pt 6pt',
                  fontWeight: 'normal',
                  backgroundColor: '#f2f2f2',
                  color: '#000000',
                  borderRight: '1pt solid #D1D5DB'
                }}>
                  Fare Amount
                </td>
                <td colSpan={3} style={{ 
                  padding: '2pt 6pt 2pt 6pt',
                  backgroundColor: '#ffffff',
                  color: '#000000'
                }}>
                  {fareInfo.fareAmount.currency} {fareInfo.fareAmount.value}
                </td>
              </tr>
            )}
            {fareInfo?.fuelSurcharge?.value && (
              <tr style={{ borderBottom: fareInfo?.tax?.value ? '1pt solid #D1D5DB' : 'none' }}>
                <td style={{ 
                  padding: '0 6pt 2pt 6pt',
                  fontWeight: 'normal',
                  backgroundColor: '#f2f2f2',
                  color: '#000000',
                  borderRight: '1pt solid #D1D5DB'
                }}>
                  Fuel Surcharge
                </td>
                <td colSpan={3} style={{ 
                  padding: '0 6pt 2pt 6pt',
                  fontWeight: 'bold',
                  backgroundColor: '#ffffff',
                  color: '#000000'
                }}>
                  {fareInfo.fuelSurcharge.currency} {fareInfo.fuelSurcharge.value}
                </td>
              </tr>
            )}
            {fareInfo?.tax?.value && (
              <tr style={{ borderBottom: fareInfo?.changeFee?.value ? '1pt solid #D1D5DB' : 'none' }}>
                <td style={{ 
                  padding: '0 6pt 2pt 6pt',
                  fontWeight: 'normal',
                  backgroundColor: '#f2f2f2',
                  color: '#000000',
                  borderRight: '1pt solid #D1D5DB'
                }}>
                  Tax
                </td>
                <td colSpan={3} style={{ 
                  padding: '0 6pt 2pt 6pt',
                  fontWeight: 'bold',
                  backgroundColor: '#ffffff',
                  color: '#000000'
                }}>
                  {fareInfo.tax.currency} {fareInfo.tax.value}
                </td>
              </tr>
            )}
            {fareInfo?.changeFee?.value && (
              <tr style={{ borderBottom: fareInfo?.totalAmount?.value ? '1pt solid #D1D5DB' : 'none' }}>
                <td style={{ 
                  padding: '0 6pt 2pt 6pt',
                  fontWeight: 'normal',
                  backgroundColor: '#f2f2f2',
                  color: '#000000',
                  borderRight: '1pt solid #D1D5DB'
                }}>
                  Change Fee
                </td>
                <td colSpan={3} style={{ 
                  padding: '0 6pt 2pt 6pt',
                  fontWeight: 'bold',
                  backgroundColor: '#ffffff',
                  color: '#000000'
                }}>
                  {fareInfo.changeFee.currency} {fareInfo.changeFee.value}
                </td>
              </tr>
            )}
            {fareInfo?.totalAmount?.value && (
              <tr>
                <td style={{ 
                  padding: '0 6pt 2pt 6pt',
                  fontWeight: 'normal',
                  backgroundColor: '#f2f2f2',
                  color: '#000000',
                  borderRight: '1pt solid #D1D5DB'
                }}>
                  Total Amount
                </td>
                <td colSpan={3} style={{ 
                  padding: '0 6pt 2pt 6pt',
                  fontWeight: 'bold',
                  backgroundColor: '#ffffff',
                  color: '#000000'
                }}>
                  {fareInfo.totalAmount.currency} {fareInfo.totalAmount.value}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* INFORMATION Section */}
      <div style={{ marginBottom: '8pt' }}>
        <div style={{ 
          backgroundColor: '#134f5c',
          color: '#FFFFFF',
          padding: '1pt 10pt 4pt 10pt',
          marginBottom: '6pt',
          fontSize: '9pt',
          fontWeight: 'bold',
          letterSpacing: '1px',
          textAlign: 'center'
        }}>
          INFORMATION
        </div>
        
        <div style={{ 
          fontSize: '7pt', 
          lineHeight: '1.5', 
          color: '#333333',
          paddingLeft: '4pt'
        }}>
          <p style={{ margin: '0 0 3pt 0' }}>
            - Please refer to the legal notice which has been linked to this ITR.
          </p>
          <p style={{ margin: '0 0 3pt 0' }}>
            - Please carry this ITR throughout your journey. Name in this ITR must match with the name in the passport.
          </p>
          <p style={{ margin: '0 0 3pt 0' }}>
            - In case of not carrying travel documents required, flight boarding or entering the country may be refused. 
            Please check the immigration regulations in advance, and prepare the documents. (Passport validity, VISA issuance)
          </p>
          <p style={{ margin: '0 0 3pt 0' }}>
            - If you paid by credit card with non-verification method when purchasing flight tickets, the cardholder must present his/her payment card when checking-in at the airport. If the payment card cannot be verified at the airport as written above, the passenger must repurchase his/her flight ticket for the relevant itinerary. Jin Air is not responsible for any problem repurchasing flight tickets due to various circumstances on the day of purchase.
          </p>
          <p style={{ margin: '0 0 3pt 0' }}>
            - Check in is closed 50 minutes before the flight departure. Please arrive the airport 2 hours before scheduled departure time.
          </p>
          <p style={{ margin: '0 0 3pt 0' }}>
            - Flight coupons or electronic coupons must be used in sequence from the origin place of departure as shown on the ticket. The ticket can't be accepted for traveling unless they are used according to sequence as stated on the ticket. Partial refunds for unused tickets (when first sector has not been completed) are not eligible.
          </p>
          <p style={{ margin: '0 0 3pt 0' }}>
            - ITR is merely a document for information and does not grant the possessor any legal rights regarding concerned carriage. Jin Air will not be liable for any changes or misusage of this ITR.
          </p>
          <p style={{ margin: '0 0 3pt 0' }}>
            - Carriage or other services provided by the airline will be applied in accordance with the Conditions of Carriage.
          </p>
          <p style={{ margin: '0' }}>
            - Please refer to the legal notice before the journey.
          </p>
        </div>
      </div>

      {/* Footer - Contact Information */}
      <div style={{ marginTop: '20pt', position: 'relative' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0', paddingTop: '3pt', color: '#666666', fontSize: '8.5pt' }}>
            <a href="mailto:ticket@cebu-jinair.com" style={{ color: '#666666', textDecoration: 'none' }}>
              ticket@cebu-jinair.com
            </a>
          </p>
          <p style={{ margin: '0', paddingTop: '4pt', color: '#666666', fontSize: '8.5pt' }}>
            0917-186-8666/032-234-8666
          </p>
          <p style={{ margin: '0', paddingTop: '4pt', color: '#666666', fontSize: '8.5pt' }}>
            Cebu Direct Club Phil. Travel &amp; Tours Inc.
          </p>
        </div>
        
        {/* Logo at bottom right */}
        <div style={{ 
          position: 'absolute', 
          right: '0', 
          bottom: '0',
          width: '60px',
          height: '60px'
        }}>
          <img 
            src="/cebu-direct-logo.jpg" 
            alt="Cebu Direct Club" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain' 
            }} 
          />
        </div>
      </div>
    </div>
  );
}

// Flight Table Component for Jin Air
interface FlightTableProps {
  journey: {
    flightNumber: string;
    departureAirportCode: string;
    departureAirportName?: string;
    departureDate: string;
    departureTime: string;
    departureTerminal?: string;
    arrivalAirportCode: string;
    arrivalAirportName?: string;
    arrivalDate: string;
    arrivalTime: string;
    arrivalTerminal?: string;
    bookingClass: string;
    notValidBefore?: string;
    notValidAfter?: string;
    baggageAllowance?: string;
  };
}

function FlightTable({ journey }: FlightTableProps) {
  // Helper to split date string "28 JAN 2025" into parts
  const splitDate = (dateStr: string) => {
    const parts = dateStr.trim().split(' ');
    return {
      day: parts[0] || '',
      month: parts[1] || '',
      year: parts[2] || ''
    };
  };

  const depDate = splitDate(journey.departureDate);
  const arrDate = splitDate(journey.arrivalDate);
  const notValidBeforeDate = splitDate(journey.notValidBefore || journey.departureDate);
  const notValidAfterDate = splitDate(journey.notValidAfter || journey.departureDate);

  return (
    <table style={{ 
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: '6pt',
      fontSize: '8pt',
      border: '1pt solid #D1D5DB'
    }}>
      <tbody>
        {/* Flight Number Row */}
        <tr style={{ borderBottom: '1pt solid #D1D5DB' }}>
          <td style={{ 
            width: '30%',
            padding: '2pt 6pt 2pt 6pt',
            fontWeight: 'normal',
            backgroundColor: '#f2f2f2',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            Flight No.
          </td>
          <td colSpan={7} style={{ 
            padding: '2pt 6pt 2pt 6pt',
            backgroundColor: '#ffffff',
            color: '#000000'
          }}>
            {journey.flightNumber}
          </td>
        </tr>

        {/* Departure Row */}
        <tr style={{ borderBottom: '1pt solid #D1D5DB' }}>
          <td style={{ 
            width: '30%',
            padding: '2pt 6pt 2pt 6pt',
            fontWeight: 'normal',
            backgroundColor: '#f2f2f2',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            Departure
          </td>
          <td style={{ 
            width: '10%',
            padding: '2pt 6pt 2pt 6pt',
            backgroundColor: '#ffffff',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            {journey.departureAirportCode}
          </td>
          <td style={{ 
            width: '7%',
            padding: '2pt 6pt 2pt 6pt',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            {depDate.day}
          </td>
          <td style={{ 
            width: '10%',
            padding: '2pt 6pt 2pt 6pt',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            {depDate.month}
          </td>
          <td style={{ 
            width: '10%',
            padding: '2pt 6pt 2pt 6pt',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            {depDate.year}
          </td>
          <td style={{ 
            width: '10%',
            padding: '2pt 6pt 2pt 6pt',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            {journey.departureTime}
          </td>
          <td style={{ 
            width: '13%',
            padding: '2pt 6pt 2pt 6pt',
            textAlign: 'center',
            fontWeight: 'normal',
            backgroundColor: '#f2f2f2',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            Terminal
          </td>
          <td style={{ 
            width: '10%',
            padding: '2pt 6pt 2pt 6pt',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            color: '#000000'
          }}>
            {journey.departureTerminal || ''}
          </td>
        </tr>

        {/* Arrival Row */}
        <tr style={{ borderBottom: '1pt solid #D1D5DB' }}>
          <td style={{ 
            width: '30%',
            padding: '2pt 6pt 2pt 6pt',
            fontWeight: 'normal',
            backgroundColor: '#f2f2f2',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            Arrival
          </td>
          <td style={{ 
            width: '10%',
            padding: '2pt 6pt 2pt 6pt',
            backgroundColor: '#ffffff',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            {journey.arrivalAirportCode}
          </td>
          <td style={{ 
            width: '7%',
            padding: '2pt 6pt 2pt 6pt',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            {arrDate.day}
          </td>
          <td style={{ 
            width: '10%',
            padding: '2pt 6pt 2pt 6pt',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            {arrDate.month}
          </td>
          <td style={{ 
            width: '10%',
            padding: '2pt 6pt 2pt 6pt',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            {arrDate.year}
          </td>
          <td style={{ 
            width: '10%',
            padding: '2pt 6pt 2pt 6pt',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            {journey.arrivalTime}
          </td>
          <td style={{ 
            width: '13%',
            padding: '2pt 6pt 2pt 6pt',
            textAlign: 'center',
            fontWeight: 'normal',
            backgroundColor: '#f2f2f2',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            Terminal
          </td>
          <td style={{ 
            width: '10%',
            padding: '2pt 6pt 2pt 6pt',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            color: '#000000'
          }}>
            {journey.arrivalTerminal || ''}
          </td>
        </tr>

        {/* Booking Class & Not Valid Before Row */}
        <tr style={{ borderBottom: '1pt solid #D1D5DB' }}>
          <td style={{ 
            width: '30%',
            padding: '2pt 6pt 2pt 6pt',
            fontWeight: 'normal',
            backgroundColor: '#f2f2f2',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            Booking Class
          </td>
          <td style={{ 
            width: '15%',
            padding: '2pt 6pt 2pt 6pt',
            backgroundColor: '#ffffff',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            {journey.bookingClass}
          </td>
          <td style={{ 
            width: '20%',
            padding: '2pt 6pt 2pt 6pt',
            fontWeight: 'normal',
            backgroundColor: '#f2f2f2',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            Not Valid Before
          </td>
          <td style={{ 
            width: '35%',
            padding: '2pt 6pt 2pt 6pt',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            color: '#000000'
          }}>
            {notValidBeforeDate.day} {notValidBeforeDate.month} {notValidBeforeDate.year}
          </td>
        </tr>

        {/* Booking Status & Not Valid After Row */}
        <tr style={{ borderBottom: '1pt solid #D1D5DB' }}>
          <td style={{ 
            width: '30%',
            padding: '2pt 6pt 2pt 6pt',
            fontWeight: 'normal',
            backgroundColor: '#f2f2f2',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            Booking Status
          </td>
          <td style={{ 
            width: '15%',
            padding: '2pt 6pt 2pt 6pt',
            backgroundColor: '#ffffff',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            HK
          </td>
          <td style={{ 
            width: '20%',
            padding: '2pt 6pt 2pt 6pt',
            fontWeight: 'normal',
            backgroundColor: '#f2f2f2',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            Not Valid After
          </td>
          <td style={{ 
            width: '35%',
            padding: '2pt 6pt 2pt 6pt',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            color: '#000000'
          }}>
            {notValidAfterDate.day} {notValidAfterDate.month} {notValidAfterDate.year}
          </td>
        </tr>

        {/* Seats & Free Baggage Row */}
        <tr>
          <td style={{ 
            width: '30%',
            padding: '2pt 6pt 2pt 6pt',
            fontWeight: 'normal',
            backgroundColor: '#f2f2f2',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            Seats
          </td>
          <td style={{ 
            width: '15%',
            padding: '2pt 6pt 2pt 6pt',
            backgroundColor: '#ffffff',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            {/* Empty for seats */}
          </td>
          <td style={{ 
            width: '20%',
            padding: '2pt 6pt 2pt 6pt',
            fontWeight: 'normal',
            backgroundColor: '#f2f2f2',
            color: '#000000',
            borderRight: '1pt solid #D1D5DB'
          }}>
            Free Baggage
          </td>
          <td style={{ 
            width: '35%',
            padding: '2pt 6pt 2pt 6pt',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            color: '#000000'
          }}>
            Total {journey.baggageAllowance || ''}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

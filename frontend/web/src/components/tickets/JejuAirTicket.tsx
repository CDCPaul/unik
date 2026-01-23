import React from 'react';
import type { AirlineTicket } from '@unik/shared/types';

interface JejuAirTicketProps {
  ticket: AirlineTicket;
  passenger: {
    lastName: string;
    firstName: string;
    gender: string;
    ticketNumber?: string;
  };
}

export default function JejuAirTicket({ ticket, passenger }: JejuAirTicketProps) {
  const passengerFullName = `${passenger.lastName} ${passenger.firstName}`;
  const journey1 = ticket.journeys[0];
  const journey2 = ticket.journeys[1];
  const isRoundTrip = ticket.journeyType === 'round-trip';
  const fareInfo = ticket.fareInformation;

  return (
    <div style={{ 
      width: '210mm',
      minHeight: '297mm',
      backgroundColor: '#ffffff',
      padding: '12mm 15mm',
      fontFamily: 'Arial, sans-serif',
      fontSize: '7.5pt',
      color: '#595959',
      boxSizing: 'border-box',
      lineHeight: '1.3'
    }}>
      {/* Logo */}
      <div style={{ paddingLeft: '5pt', marginBottom: '1pt' }}>
        <img 
          src="/jeju-air-logo.png" 
          alt="JEJUair" 
          style={{ height: '30px', width: 'auto', objectFit: 'contain' }}
        />
      </div>

      {/* Important Information - 안내사항 */}
      <div style={{ marginTop: '8pt', marginBottom: '4pt' }}>
        <p style={{ paddingLeft: '5pt', margin: '0 0 2pt 0', lineHeight: '1.6', fontSize: '7.5pt' }}>
          -For changes or cancellation of flight tickets, please contact to the initial place of purchase.
        </p>
        <p style={{ paddingLeft: '5pt', margin: '0 0 2pt 0', lineHeight: '1.6', fontSize: '7.5pt' }}>
          -Boarding process is closed before 60 minutes of departure of the related flight. for smooth boarding process, please be arrived to the airport before 2 hours of departure.
        </p>
        <p style={{ paddingLeft: '5pt', margin: '0 0 2pt 0', lineHeight: '1.6', fontSize: '7.5pt' }}>
          -Your International E-Ticket must be used in order,if not,your ticket would be invalid.
        </p>
        <p style={{ paddingLeft: '5pt', margin: '0 0 2pt 0', lineHeight: '1.6', fontSize: '7.5pt' }}>
          *Allowance for international routes (except for the routes to/from America): 1 pieces =15KG (Exception: Booking Class Y 1 pieces =20KG)
        </p>
        <p style={{ paddingLeft: '5pt', margin: '0 0 2pt 0', lineHeight: '1.6', fontSize: '7.5pt' }}>
          *Allowance for Routes to/from America (Guam/Saipan): 1 pieces =23KG
        </p>
        <p style={{ paddingLeft: '5pt', margin: 0, lineHeight: '1.6', fontSize: '7.5pt' }}>
          -Terms and Conditions of purchased ticket is applied JEJUAIR
        </p>
      </div>

      {/* ITINERARY & PASSENGER INFORMATION Header - 회색 영역 */}
      <table style={{ 
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '2pt',
        marginBottom: '0'
      }}>
        <tbody>
          <tr style={{ height: '22pt' }}>
            <td style={{ 
              backgroundColor: '#BEBEBE',
              paddingTop: '5pt',
              paddingBottom: '8pt',
              paddingLeft: '10pt',
              paddingRight: '10pt',
              verticalAlign: 'top'
            }}>
              <p style={{ 
                color: '#FFFFFF',
                fontSize: '10pt',
                fontWeight: 'normal',
                margin: 0,
                letterSpacing: '0.5px',
                lineHeight: '1'
              }}>
                ITINERARY &amp; PASSENGER INFORMATION
              </p>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Passenger Name & Booking Reference - 주황색 영역 */}
      <table style={{ 
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '0',
        marginBottom: '0'
      }}>
        <tbody>
          <tr style={{ height: '24pt' }}>
            <td style={{ 
              backgroundColor: '#FF6B00',
              padding: '0 10pt',
              color: '#FFFFFF',
              fontSize: '7.5pt',
              fontWeight: 'normal',
              width: '140pt',
              verticalAlign: 'middle',
              height: '24pt'
            }}>
              Passenger Name
            </td>
            <td style={{ 
              backgroundColor: '#FF6B00',
              padding: '0 10pt',
              color: '#FFFFFF',
              fontSize: '9pt',
              fontWeight: 'bold',
              verticalAlign: 'middle',
              height: '24pt'
            }}>
              {passengerFullName} <span style={{ marginLeft: '12pt' }}>{passenger.gender}</span>
            </td>
          </tr>
          <tr style={{ height: '24pt' }}>
            <td style={{ 
              backgroundColor: '#FF6B00',
              padding: '0 10pt',
              color: '#FFFFFF',
              fontSize: '7.5pt',
              fontWeight: 'normal',
              width: '140pt',
              verticalAlign: 'middle',
              height: '24pt'
            }}>
              Booking Reference
            </td>
            <td style={{ 
              backgroundColor: '#FF6B00',
              padding: '0 10pt',
              color: '#FFFFFF',
              fontSize: '9pt',
              fontWeight: 'bold',
              verticalAlign: 'middle',
              height: '24pt'
            }}>
              {ticket.reservationNumber}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Flight Tables */}
      <div style={{ marginLeft: '0', marginTop: '0' }}>
        <FlightTable journey={journey1} />
        
        {isRoundTrip && journey2 && (
          <FlightTable journey={journey2} />
        )}
      </div>

      {/* Warning Message */}
      <p style={{ 
        color: '#F15226',
        fontWeight: 'bold',
        fontSize: '7.5pt',
        paddingTop: '8pt',
        paddingLeft: '8pt',
        margin: 0
      }}>
        Please verify flight times prior to departure
      </p>

      {/* TICKET & FARE INFORMATION Header */}
      <table style={{ 
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '12pt',
        marginBottom: '0'
      }}>
        <tbody>
          <tr style={{ height: '22pt' }}>
            <td style={{ 
              backgroundColor: '#BEBEBE',
              paddingTop: '5pt',
              paddingBottom: '8pt',
              paddingLeft: '10pt',
              paddingRight: '10pt',
              verticalAlign: 'top'
            }}>
              <p style={{ 
                color: '#FFFFFF',
                fontSize: '10pt',
                fontWeight: 'normal',
                margin: 0,
                letterSpacing: '0.5px',
                lineHeight: '1'
              }}>
                TICKET &amp; FARE INFORMATION
              </p>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Fare Information Table */}
      <table style={{ 
        borderCollapse: 'collapse',
        width: '100%',
        marginTop: '0',
        fontSize: '7.5pt'
      }}>
        <tbody>
          <tr style={{ height: '18pt' }}>
            <td style={{ 
              width: '89pt',
              backgroundColor: '#F7F7F7',
              padding: '4pt 0 4pt 8pt',
              verticalAlign: 'middle'
            }}>
              <p style={{ color: '#595959', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>Agent Name</p>
            </td>
            <td colSpan={3} style={{ 
              padding: '4pt 0 4pt 8pt',
              verticalAlign: 'middle'
            }}>
              <p style={{ color: '#595959', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>{ticket.agentName}</p>
            </td>
          </tr>
          <tr style={{ height: '18pt' }}>
            <td style={{ 
              width: '89pt',
              backgroundColor: '#F7F7F7',
              padding: '4pt 0 4pt 8pt',
              verticalAlign: 'middle'
            }}>
              <p style={{ color: '#595959', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>Date of Issue</p>
            </td>
            <td colSpan={3} style={{ 
              padding: '4pt 0 4pt 8pt',
              verticalAlign: 'middle'
            }}>
              <p style={{ color: '#595959', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>
                {ticket.bookingDate.split(' ')[0]} {ticket.bookingDate.split(' ')[1]} {ticket.bookingDate.split(' ')[2]}
              </p>
            </td>
          </tr>
          <tr style={{ height: '18pt' }}>
            <td style={{ 
              width: '89pt',
              backgroundColor: '#F7F7F7',
              padding: '4pt 0 4pt 8pt',
              verticalAlign: 'middle'
            }}>
              <p style={{ color: '#595959', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>Notes</p>
            </td>
            <td colSpan={3} style={{ 
              padding: '4pt 0 4pt 8pt',
              verticalAlign: 'middle'
            }}>
              <p style={{ color: '#595959', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>{ticket.notes || ''}</p>
            </td>
          </tr>
          
          {/* Fare Information - Only show if data exists */}
          {fareInfo?.formOfPayment && (
            <tr style={{ height: '18pt' }}>
              <td style={{ 
                width: '89pt',
                backgroundColor: '#F7F7F7',
                padding: '4pt 0 4pt 8pt',
                verticalAlign: 'middle'
              }}>
                <p style={{ color: '#595959', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>Form of Payment</p>
              </td>
              <td colSpan={3} style={{ 
                padding: '4pt 0 4pt 8pt',
                verticalAlign: 'middle'
              }}>
                <p style={{ color: '#595959', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>{fareInfo.formOfPayment}</p>
              </td>
            </tr>
          )}
          
          {fareInfo?.fareAmount && fareInfo.fareAmount.value && (
            <tr style={{ height: '18pt' }}>
              <td style={{ 
                width: '89pt',
                backgroundColor: '#F7F7F7',
                padding: '4pt 0 4pt 8pt',
                verticalAlign: 'middle'
              }}>
                <p style={{ color: '#595959', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>Fare Amount</p>
              </td>
              <td colSpan={3} style={{ 
                padding: '4pt 0 4pt 8pt',
                verticalAlign: 'middle'
              }}>
                <p style={{ color: '#595959', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>
                  {fareInfo.fareAmount.currency}
                </p>
              </td>
            </tr>
          )}
          
          {fareInfo?.fuelSurcharge && fareInfo.fuelSurcharge.value && (
            <tr style={{ height: '18pt' }}>
              <td style={{ 
                width: '89pt',
                backgroundColor: '#F7F7F7',
                padding: '4pt 0 4pt 8pt',
                verticalAlign: 'middle'
              }}>
                <p style={{ color: '#595959', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>Fuel Surcharge</p>
              </td>
              <td colSpan={3} style={{ 
                padding: '4pt 0 4pt 8pt',
                verticalAlign: 'middle'
              }}>
                <p style={{ color: '#595959', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>
                  {fareInfo.fuelSurcharge.currency}
                </p>
              </td>
            </tr>
          )}
          
          {fareInfo?.tax && fareInfo.tax.value && (
            <tr style={{ height: '18pt' }}>
              <td style={{ 
                width: '89pt',
                backgroundColor: '#F7F7F7',
                padding: '4pt 0 4pt 8pt',
                verticalAlign: 'middle'
              }}>
                <p style={{ color: '#595959', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>Tax</p>
              </td>
              <td colSpan={3} style={{ 
                padding: '4pt 0 4pt 8pt',
                verticalAlign: 'middle'
              }}>
                <p style={{ color: '#595959', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>
                  {fareInfo.tax.currency}
                </p>
              </td>
            </tr>
          )}
          
          {fareInfo?.changeFee && fareInfo.changeFee.value && (
            <tr style={{ height: '18pt' }}>
              <td style={{ 
                width: '89pt',
                backgroundColor: '#F7F7F7',
                padding: '4pt 0 4pt 8pt',
                verticalAlign: 'middle'
              }}>
                <p style={{ color: '#595959', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>Change Fee</p>
              </td>
              <td colSpan={3} style={{ 
                padding: '4pt 0 4pt 8pt',
                verticalAlign: 'middle'
              }}>
                <p style={{ color: '#595959', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>
                  {fareInfo.changeFee.currency} {fareInfo.changeFee.value}
                </p>
              </td>
            </tr>
          )}
          
          {fareInfo?.totalAmount && fareInfo.totalAmount.value && (
            <tr style={{ height: '18pt' }}>
              <td style={{ 
                width: '89pt',
                backgroundColor: '#F7F7F7',
                padding: '4pt 0 4pt 8pt',
                verticalAlign: 'middle'
              }}>
                <p style={{ color: '#595959', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>Total Amount</p>
              </td>
              <td colSpan={3} style={{ 
                padding: '4pt 0 4pt 8pt',
                verticalAlign: 'middle'
              }}>
                <p style={{ color: '#595959', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>
                  {fareInfo.totalAmount.currency} {fareInfo.totalAmount.value}
                </p>
              </td>
            </tr>
          )}
          
          {ticket.extraServices && ticket.extraServices.filter(s => s.name || s.data).map((service, idx) => (
            <tr key={idx} style={{ height: '18pt' }}>
              <td style={{ 
                width: '89pt',
                backgroundColor: '#F7F7F7',
                padding: '4pt 0 4pt 8pt',
                verticalAlign: 'middle'
              }}>
                <p style={{ color: '#595959', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>{service.name}</p>
              </td>
              <td colSpan={3} style={{ 
                padding: '4pt 0 4pt 8pt',
                verticalAlign: 'middle'
              }}>
                <p style={{ color: '#595959', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>{service.data}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer - Contact Information */}
      <div style={{ marginTop: '20pt', position: 'relative' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0', paddingTop: '3pt', color: '#808080', fontSize: '7.5pt' }}>
            <a href="mailto:air@cebu-jejuair.net" style={{ color: '#808080', textDecoration: 'none' }}>
              air@cebu-jejuair.net
            </a>
          </p>
          <p style={{ margin: '0', paddingTop: '6pt', color: '#808080', fontSize: '7.5pt' }}>
            +63-917-673-7107
          </p>
          <p style={{ margin: '0', paddingTop: '6pt', color: '#808080', fontSize: '7.5pt' }}>
            Cebu Direct Club Phil. Travel &amp; Tours, Inc.
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

// Flight Table Component
interface FlightTableProps {
  journey: {
    flightNumber: string;
    departureAirportCode: string;
    departureAirportName: string;
    departureDate: string;
    departureTime: string;
    departureTerminal?: string;
    arrivalAirportCode: string;
    arrivalAirportName: string;
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
  // Helper to split date string "27 OCT 2025" into parts
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
  const notValidBeforeDate = splitDate(journey.notValidBefore || journey.departureDate);
  const notValidAfterDate = splitDate(journey.notValidAfter || journey.departureDate);

  return (
    <table style={{ 
      borderCollapse: 'collapse',
      width: '100%',
      marginBottom: '0',
      fontSize: '7.5pt'
    }}>
      <tbody>
        {/* Flight Number Row */}
        <tr style={{ height: '18pt' }}>
          <td style={{ 
            width: '89pt',
            backgroundColor: '#F7F7F7',
            borderTop: '1pt solid #BEBEBE',
            padding: '4pt 0 4pt 8pt',
            verticalAlign: 'middle'
          }}>
            <p style={{ color: '#808080', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>Flight</p>
          </td>
          <td colSpan={8} style={{ 
            borderTop: '1pt solid #BEBEBE',
            padding: '4pt 0 4pt 8pt',
            verticalAlign: 'middle'
          }}>
            <p style={{ color: '#F15226', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{journey.flightNumber}</p>
          </td>
        </tr>

        {/* Departure Row */}
        <tr style={{ height: '18pt' }}>
          <td style={{ 
            width: '89pt',
            backgroundColor: '#F7F7F7',
            padding: '4pt 0 4pt 8pt',
            verticalAlign: 'middle'
          }}>
            <p style={{ color: '#808080', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>Departure</p>
          </td>
          <td style={{ width: '75pt', padding: '4pt 0 4pt 8pt', verticalAlign: 'middle' }}>
            <p style={{ color: '#F15226', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{journey.departureAirportCode}</p>
          </td>
          <td style={{ width: '39pt', verticalAlign: 'middle' }}></td>
          <td style={{ width: '26pt', padding: '4pt 4pt 4pt 0', textAlign: 'center', verticalAlign: 'middle' }}>
            <p style={{ color: '#F45226', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{depDate.day}</p>
          </td>
          <td style={{ width: '40pt', padding: '4pt 4pt 4pt 0', textAlign: 'center', verticalAlign: 'middle' }}>
            <p style={{ color: '#F15226', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{depDate.month}</p>
          </td>
          <td style={{ width: '67pt', padding: '4pt 0', textAlign: 'center', verticalAlign: 'middle' }}>
            <p style={{ color: '#F15226', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{depDate.year}</p>
          </td>
          <td style={{ width: '61pt', padding: '4pt 0 4pt 8pt', verticalAlign: 'middle' }}>
            <p style={{ color: '#F15226', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{journey.departureTime}</p>
          </td>
          <td style={{ width: '57pt', padding: '4pt 0', textAlign: 'center', verticalAlign: 'middle' }}>
            <p style={{ color: '#F15226', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>Terminal</p>
          </td>
          <td style={{ width: '34pt', padding: '4pt 8pt 4pt 0', textAlign: 'center', verticalAlign: 'middle' }}>
            <p style={{ color: '#F15226', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{journey.departureTerminal}</p>
          </td>
        </tr>

        {/* Arrival Row */}
        <tr style={{ height: '18pt' }}>
          <td style={{ 
            width: '89pt',
            backgroundColor: '#F7F7F7',
            padding: '4pt 0 4pt 8pt',
            verticalAlign: 'middle'
          }}>
            <p style={{ color: '#808080', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>Arrival</p>
          </td>
          <td style={{ 
            width: '75pt',
            padding: '4pt 0 4pt 8pt',
            verticalAlign: 'middle'
          }}>
            <p style={{ color: '#F15226', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{journey.arrivalAirportCode}</p>
          </td>
          <td style={{ width: '39pt', verticalAlign: 'middle' }}></td>
          <td style={{ 
            width: '26pt',
            padding: '4pt 4pt 4pt 0',
            textAlign: 'center',
            verticalAlign: 'middle'
          }}>
            <p style={{ color: '#F45226', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{arrDate.day}</p>
          </td>
          <td style={{ 
            width: '40pt',
            padding: '4pt 4pt 4pt 0',
            textAlign: 'center',
            verticalAlign: 'middle'
          }}>
            <p style={{ color: '#F15226', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{arrDate.month}</p>
          </td>
          <td style={{ 
            width: '67pt',
            padding: '4pt 0',
            textAlign: 'center',
            verticalAlign: 'middle'
          }}>
            <p style={{ color: '#F15226', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{arrDate.year}</p>
          </td>
          <td style={{ 
            width: '61pt',
            padding: '4pt 0 4pt 8pt',
            verticalAlign: 'middle'
          }}>
            <p style={{ color: '#F15226', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{journey.arrivalTime}</p>
          </td>
          <td style={{ 
            width: '57pt',
            padding: '4pt 0',
            textAlign: 'center',
            verticalAlign: 'middle'
          }}>
            <p style={{ color: '#F15226', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>Terminal</p>
          </td>
          <td style={{ 
            width: '34pt',
            padding: '4pt 8pt 4pt 0',
            textAlign: 'center',
            verticalAlign: 'middle'
          }}>
            <p style={{ color: '#F15226', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{journey.arrivalTerminal}</p>
          </td>
        </tr>

        {/* Border Row after Arrival */}
        <tr style={{ height: '3pt' }}>
          <td colSpan={9} style={{ 
            borderBottom: '1pt solid #BEBEBE',
            padding: 0
          }}></td>
        </tr>

        {/* Not Valid Before & Booking Class Row */}
        <tr style={{ height: '18pt' }}>
          <td style={{ 
            width: '89pt',
            backgroundColor: '#F7F7F7',
            padding: '4pt 0 4pt 8pt',
            verticalAlign: 'middle'
          }}>
            <p style={{ color: '#808080', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>Not Valid Before</p>
          </td>
          <td style={{ 
            width: '75pt',
            padding: '4pt 0 4pt 8pt',
            verticalAlign: 'middle'
          }}>
            <p style={{ color: '#595959', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{notValidBeforeDate.day}</p>
          </td>
          <td style={{ 
            width: '39pt',
            padding: '4pt 0 4pt 6pt',
            verticalAlign: 'middle'
          }}>
            <p style={{ color: '#595959', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{notValidBeforeDate.month}</p>
          </td>
          <td style={{ width: '26pt', verticalAlign: 'middle' }}></td>
          <td style={{ 
            width: '40pt',
            padding: '4pt 0 4pt 1pt',
            verticalAlign: 'middle'
          }}>
            <p style={{ color: '#595959', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{notValidBeforeDate.year}</p>
          </td>
          <td style={{ 
            width: '128pt',
            backgroundColor: '#F7F7F7',
            padding: '4pt 0 4pt 8pt',
            verticalAlign: 'middle'
          }} colSpan={2}>
            <p style={{ color: '#808080', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>Booking Class</p>
          </td>
          <td style={{ 
            width: '91pt',
            padding: '4pt 0 4pt 8pt',
            verticalAlign: 'middle'
          }} colSpan={2}>
            <p style={{ color: '#595959', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{journey.bookingClass} (Special fare)</p>
          </td>
        </tr>

        {/* Not Valid After & Booking Status Row */}
        <tr style={{ height: '18pt' }}>
          <td style={{ 
            width: '89pt',
            backgroundColor: '#F7F7F7',
            padding: '4pt 0 4pt 8pt',
            verticalAlign: 'middle'
          }}>
            <p style={{ color: '#808080', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>Not Valid After</p>
          </td>
          <td style={{ 
            width: '75pt',
            padding: '4pt 0 4pt 8pt',
            verticalAlign: 'middle'
          }}>
            <p style={{ color: '#595959', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{notValidAfterDate.day}</p>
          </td>
          <td style={{ 
            width: '39pt',
            padding: '4pt 0 4pt 6pt',
            verticalAlign: 'middle'
          }}>
            <p style={{ color: '#595959', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{notValidAfterDate.month}</p>
          </td>
          <td style={{ width: '26pt', verticalAlign: 'middle' }}></td>
          <td style={{ 
            width: '40pt',
            padding: '4pt 0 4pt 1pt',
            verticalAlign: 'middle'
          }}>
            <p style={{ color: '#595959', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{notValidAfterDate.year}</p>
          </td>
          <td style={{ 
            width: '128pt',
            backgroundColor: '#F7F7F7',
            padding: '4pt 0 4pt 8pt',
            verticalAlign: 'middle'
          }} colSpan={2}>
            <p style={{ color: '#808080', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>Booking Status</p>
          </td>
          <td style={{ 
            width: '91pt',
            padding: '4pt 0',
            textAlign: 'center',
            verticalAlign: 'middle'
          }} colSpan={2}>
            <p style={{ color: '#595959', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>OK</p>
          </td>
        </tr>

        {/* Seats & Free Baggage Row */}
        <tr style={{ height: '18pt' }}>
          <td style={{ 
            width: '89pt',
            backgroundColor: '#F7F7F7',
            padding: '4pt 0 4pt 8pt',
            verticalAlign: 'middle'
          }}>
            <p style={{ color: '#808080', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>Seats</p>
          </td>
          <td style={{ width: '75pt', verticalAlign: 'middle' }}></td>
          <td style={{ width: '39pt', verticalAlign: 'middle' }}></td>
          <td style={{ width: '26pt', verticalAlign: 'middle' }}></td>
          <td style={{ width: '40pt', verticalAlign: 'middle' }}></td>
          <td style={{ 
            width: '128pt',
            backgroundColor: '#F7F7F7',
            padding: '4pt 0 4pt 8pt',
            verticalAlign: 'middle'
          }} colSpan={2}>
            <p style={{ color: '#808080', fontSize: '7.5pt', margin: 0, fontWeight: 'normal' }}>Free Baggage</p>
          </td>
          <td style={{ 
            width: '91pt',
            padding: '4pt 0',
            textAlign: 'center',
            verticalAlign: 'middle'
          }} colSpan={2}>
            <p style={{ color: '#595959', fontWeight: 'bold', fontSize: '7.5pt', margin: 0 }}>{journey.baggageAllowance}</p>
          </td>
        </tr>

        {/* Bottom Border Row */}
        <tr style={{ height: '3pt' }}>
          <td colSpan={9} style={{ 
            borderBottom: '1pt solid #BEBEBE',
            padding: 0
          }}></td>
        </tr>
      </tbody>
    </table>
  );
}

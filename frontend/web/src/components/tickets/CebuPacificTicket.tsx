import React from 'react';
import type { AirlineTicket, TicketPassenger } from '@unik/shared/types';

interface CebuPacificTicketProps {
  ticket: AirlineTicket;
  passenger: TicketPassenger;
}

const CebuPacificTicket: React.FC<CebuPacificTicketProps> = ({ ticket, passenger }) => {
  // 날짜를 요일 포함 형식으로 변환
  const formatDateWithDay = (dateStr: string) => {
    // "03 JAN 2026" 형식을 파싱
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
    // "21:35" 형식을 파싱
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')} H (${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period})`;
  };

  return (
    <div style={{ 
      width: '800px', 
      margin: '0 auto', 
      padding: '15px 30px',
      backgroundColor: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      lineHeight: '1.3'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <img 
            src="/5J.png" 
            alt="Cebu Pacific" 
            style={{ height: '120px', width: 'auto' }}
          />
        </div>
        <h1 style={{ 
          fontSize: '14px', 
          fontWeight: 'bold',
          margin: 0,
          color: '#333',
          textAlign: 'right',
          letterSpacing: '0.5px',
          fontFamily: 'Georgia, serif'
        }}>
          ITINERARY RECEIPT
        </h1>
      </div>

      {/* Booking Details */}
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ 
          fontSize: '12px', 
          fontWeight: 'bold',
          marginBottom: '8px',
          color: '#0075ca',
          fontFamily: 'Georgia, serif'
        }}>
          Booking Details
        </h2>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          border: '1px solid #ddd',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          <tbody>
            <tr>
              <td style={{ 
                padding: '8px',
                borderRight: '1px solid #ddd',
                width: '33.33%',
                verticalAlign: 'top',
                backgroundColor: '#ffffff'
              }}>
                <div style={{ fontSize: '10px', color: '#666', marginBottom: '3px' }}>Status:</div>
                <div style={{ fontWeight: 'bold', color: '#333' }}>CONFIRMED</div>
              </td>
              <td style={{ 
                padding: '8px',
                borderRight: '1px solid #ddd',
                width: '33.33%',
                verticalAlign: 'top',
                backgroundColor: '#ffffff'
              }}>
                <div style={{ fontSize: '10px', color: '#666', marginBottom: '3px' }}>Booking Date:</div>
                <div style={{ fontWeight: 'bold', color: '#333' }}>{ticket.bookingDate}</div>
              </td>
              <td style={{ 
                padding: '8px',
                width: '33.33%',
                verticalAlign: 'top',
                backgroundColor: '#FFEB3B'
              }}>
                <div style={{ fontSize: '10px', color: '#666', marginBottom: '3px' }}>Booking Reference:</div>
                <div style={{ fontWeight: 'bold', color: '#333' }}>{ticket.reservationNumber}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Flight Details */}
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ 
          fontSize: '12px', 
          fontWeight: 'bold',
          marginBottom: '8px',
          color: '#0075ca',
          fontFamily: 'Georgia, serif'
        }}>
          Flight Details
        </h2>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          border: '1px solid #ddd',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f9f9f9' }}>
              <th style={{ 
                padding: '6px',
                textAlign: 'left',
                borderBottom: '1px solid #ddd',
                fontSize: '10px',
                color: '#666'
              }}>Flight No./ Airline</th>
              <th style={{ 
                padding: '6px',
                textAlign: 'left',
                borderBottom: '1px solid #ddd',
                fontSize: '10px',
                color: '#666'
              }}>Departure</th>
              <th style={{ 
                padding: '6px',
                textAlign: 'center',
                borderBottom: '1px solid #ddd',
                width: '40px'
              }}></th>
              <th style={{ 
                padding: '6px',
                textAlign: 'left',
                borderBottom: '1px solid #ddd',
                fontSize: '10px',
                color: '#666'
              }}>Arrival</th>
            </tr>
          </thead>
          <tbody>
            {ticket.journeys.map((journey, idx) => (
              <tr key={idx}>
                <td style={{ 
                  padding: '8px',
                  borderBottom: idx < ticket.journeys.length - 1 ? '1px solid #ddd' : 'none'
                }}>
                  <div style={{ fontSize: '14px', color: '#0075ca', marginBottom: '3px' }}>✈</div>
                  <div style={{ fontWeight: 'bold', color: '#0075ca', fontSize: '11px' }}>
                    {journey.flightNumber}
                  </div>
                </td>
                <td style={{ 
                  padding: '8px', 
                  borderBottom: idx < ticket.journeys.length - 1 ? '1px solid #ddd' : 'none'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: '11px' }}>
                    {journey.departureAirportCode === 'ICN' ? 'Seoul (ICN)' : 'Cebu (CEB)'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#0075ca', marginBottom: '2px' }}>
                    {journey.departureAirportName}
                    {journey.departureTerminal && ` - Terminal ${journey.departureTerminal}`}
                  </div>
                  <div style={{ fontSize: '10px' }}>
                    {formatDateWithDay(journey.departureDate)} • {formatTime(journey.departureTime)}
                  </div>
                </td>
                <td style={{ 
                  padding: '8px',
                  borderBottom: idx < ticket.journeys.length - 1 ? '1px solid #ddd' : 'none',
                  textAlign: 'center',
                  fontSize: '16px',
                  color: '#0075ca',
                  fontWeight: 'bold'
                }}>
                  →
                </td>
                <td style={{ 
                  padding: '8px',
                  borderBottom: idx < ticket.journeys.length - 1 ? '1px solid #ddd' : 'none'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: '11px' }}>
                    {journey.arrivalAirportCode === 'ICN' ? 'Seoul (ICN)' : 'Cebu (CEB)'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#0075ca', marginBottom: '2px' }}>
                    {journey.arrivalAirportName}
                    {journey.arrivalTerminal && ` - Terminal ${journey.arrivalTerminal}`}
                  </div>
                  <div style={{ fontSize: '10px' }}>
                    {formatDateWithDay(journey.arrivalDate)} • {formatTime(journey.arrivalTime)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reminders */}
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ 
          fontSize: '12px', 
          fontWeight: 'bold',
          marginBottom: '6px',
          color: '#0075ca',
          fontFamily: 'Georgia, serif'
        }}>
          Reminders
        </h2>
        <div style={{ 
          fontSize: '10px',
          lineHeight: '1.4',
          color: '#333'
        }}>
          Guests booked on Cebu Pacific's interline partners may need to transfer airport terminals when transiting via Manila. 
          Please proceed to the transit area for the free Manila International Airport Authority shuttle service from 05:30 AM to 01:00 AM of the following day. 
          The MIAA shuttle leaves every 30 to 40 minutes.
        </div>
      </div>

      {/* Guest Details */}
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ 
          fontSize: '12px', 
          fontWeight: 'bold',
          marginBottom: '8px',
          color: '#0075ca',
          fontFamily: 'Georgia, serif'
        }}>
          Guest Details
        </h2>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          border: '1px solid #ddd',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f9f9f9' }}>
              <th style={{ 
                padding: '6px',
                textAlign: 'left',
                borderBottom: '1px solid #ddd',
                fontSize: '10px',
                color: '#666'
              }}>Name</th>
              <th style={{ 
                padding: '6px',
                textAlign: 'left',
                borderBottom: '1px solid #ddd',
                fontSize: '10px',
                color: '#666'
              }}>Flight</th>
              <th style={{ 
                padding: '6px',
                textAlign: 'left',
                borderBottom: '1px solid #ddd',
                fontSize: '10px',
                color: '#666'
              }}>Add-ons</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ 
                padding: '8px',
                verticalAlign: 'top'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '2px', fontSize: '11px' }}>
                  {passenger.gender ? `${passenger.gender.toUpperCase()} ` : ''}{passenger.firstName.toUpperCase()} {passenger.lastName.toUpperCase()}
                </div>
                <div style={{ fontSize: '10px', color: '#666' }}>
                  {passenger.type || 'Adult'}
                </div>
              </td>
              <td style={{ 
                padding: '8px',
                verticalAlign: 'top',
                fontSize: '10px'
              }}>
                {ticket.journeys.map((j, idx) => (
                  <div key={idx} style={{ marginBottom: idx < ticket.journeys.length - 1 ? '3px' : 0 }}>
                    {j.departureAirportCode} - {j.arrivalAirportCode}
                  </div>
                ))}
              </td>
              <td style={{ 
                padding: '8px',
                verticalAlign: 'top',
                fontSize: '10px'
              }}>
                <div style={{ marginBottom: '3px' }}>
                  {ticket.journeys[0]?.bookingClass || 'GO Basic'}
                </div>
                <div style={{ color: '#666' }}>
                  Seat : Unassigned
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Check-in Guidelines */}
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ 
          fontSize: '12px', 
          fontWeight: 'bold',
          marginBottom: '6px',
          color: '#0075ca',
          fontFamily: 'Georgia, serif'
        }}>
          Check-in Guidelines
        </h2>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          fontSize: '9px',
          lineHeight: '1.3'
        }}>
          {/* 왼쪽 열 */}
          <div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Booking Changes</div>
              <div style={{ color: '#333' }}>
                Changes must be done more than 2 hours before the flight subject to penalties and fare difference.
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Online check-in</div>
              <div style={{ color: '#333' }}>
                Check in through the Cebu Pacific mobile app or website to get your seat number and boarding pass.
              </div>
              <div style={{ color: '#333', marginTop: '2px', fontSize: '8px' }}>
                Mobile and web check-in options are available as early as 7 days before the flight. For domestic travel, you have until 1 hour before the flight to do your online check-in, and it's up to 4 hours before the flight for international travel.
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Airport counters and boarding gates</div>
              <div style={{ color: '#333' }}>
                Bag Drop and check-in counters open as early as 3 hours before your flight. Check-in and boarding times vary and depend on the airport of departure.
              </div>
              <div style={{ color: '#333', marginTop: '2px', fontSize: '8px' }}>
                <strong>Counter and Bag Drop closure</strong><br/>
                Flights leaving Dubai, Macau, and Shanghai: 60 minutes before departure<br/>
                All other flights: 45 minutes before departure<br/>
                After check-in, you must be at your designated boarding gate 30 minutes before the scheduled time of departure.<br/>
                Guests will not be allowed to take the flight after check-in counters and boarding gates close.<br/>
                For guests with Interline itineraries, the Operating Carrier's check-in and boarding times apply.
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Valid Photo ID</div>
              <div style={{ color: '#333' }}>
                For guests with Interline itineraries, the Operating Carrier's check-in and boarding times apply.
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Prepaid Baggage</div>
              <div style={{ color: '#333' }}>
                Purchase Prepaid Baggage up to 2 hours before your flight.
              </div>
              <div style={{ color: '#333', marginTop: '2px', fontSize: '8px' }}>
                Bags for check-in must not exceed 30 kilos per piece, and not contain fragile or valuable items. You may carry one item inside the aircraft cabin, provided it weighs 7 kilos or less.
              </div>
            </div>
          </div>

          {/* 오른쪽 열 */}
          <div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Travel documents</div>
              <div style={{ color: '#333', fontSize: '8px' }}>
                International travelers must present valid passports and applicable visas. Cebu Pacific is a point-to-point carrier so please ensure that you have all the necessary visas or documents required for entry to the destination indicated on your Cebu Pacific itinerary.
              </div>
              <div style={{ color: '#333', marginTop: '2px', fontSize: '8px' }}>
                Those connecting via Dubai may avail of baggage transfer services 24 hours before arrival.
              </div>
              <div style={{ color: '#333', marginTop: '2px', fontSize: '8px' }}>
                All passengers flying into Sydney must clear immigration upon arrival. Those who have onward connections to a third country will not be able to use transit facilities and cannot avail of the transit-without-visa privilege, regardless of their connecting time.
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Philippine Travel Tax</div>
              <div style={{ color: '#333', fontSize: '8px' }}>
                Philippine passport holders are required to pay for the Philippine Travel Tax amounting to Php1,620 when traveling internationally from the Philippines. For bookings made online or through the call center, you may pay through TIEZA (Tourism Infrastructure and Enterprise Zone Authority) website or at their booth on the day of travel.
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Terms and Conditions</div>
              <div style={{ color: '#333', fontSize: '8px' }}>
                You may view the full Cebu Pacific and Cebgo Terms and Conditions by going to https://www.cebupacificair.com/pages/plan-trip/conditions-of-carriage
              </div>
              <div style={{ color: '#333', marginTop: '2px', fontSize: '8px' }}>
                and your Air Passenger Rights here: http://www.gov.ph/2012/12/10/dotc-dti-joint-administrative-order-no-1-s-2012
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        marginTop: '14px',
        paddingTop: '10px',
        borderTop: '1px solid #ddd',
        textAlign: 'center',
        fontSize: '9px',
        color: '#666',
        lineHeight: '1.4'
      }}>
        <div style={{ marginBottom: '4px' }}>
          For full Terms and Conditions, visit: <strong>www.cebupacificair.com</strong>
        </div>
        <div>
          Agent: {ticket.agentName}
        </div>
      </div>
    </div>
  );
};

export default CebuPacificTicket;

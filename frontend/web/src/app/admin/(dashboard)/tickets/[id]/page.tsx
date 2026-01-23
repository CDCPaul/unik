'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTicket } from '@/lib/services/admin/tickets';
import { Loader2 } from 'lucide-react';

export default function LegacyTicketRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  useEffect(() => {
    const redirectToAirlineSpecificPage = async () => {
      try {
        const ticket = await getTicket(ticketId);
        
        if (!ticket) {
          alert('티켓을 찾을 수 없습니다.');
          router.push('/admin/tickets');
          return;
        }

        // 항공사별 경로 매핑
        const airlineRoutes: Record<string, string> = {
          'JIN': 'jin',
          'JEJU': 'jeju',
          '5J': 'cebu',
          'BX': 'airbusan',
          'AIRBUSAN': 'airbusan'
        };

        const airlineRoute = airlineRoutes[ticket.airline] || ticket.airline.toLowerCase();
        router.replace(`/admin/tickets/${airlineRoute}/${ticketId}`);
      } catch (error) {
        console.error('Error redirecting:', error);
        alert('페이지 이동 중 오류가 발생했습니다.');
        router.push('/admin/tickets');
      }
    };

    redirectToAirlineSpecificPage();
  }, [ticketId, router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
        <p className="text-slate-500">페이지를 이동하는 중...</p>
      </div>
    </div>
  );
}

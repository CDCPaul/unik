'use client';

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import { Download, Mail, MapPin, Phone, Building2, Loader2 } from 'lucide-react';
import { getBusinessCardBySlug } from '@/lib/services/businessCards';
import { COMPANY_INFO } from '@/lib/businessCardConfig';
import type { BusinessCard } from '@unik/shared/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ProfilePage({ params }: PageProps) {
  const { slug } = use(params);
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getBusinessCardBySlug(slug);
      if (!cancelled) {
        setCard(result);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">명함을 찾을 수 없습니다</h1>
        <p className="text-slate-500">
          요청하신 프로필이 존재하지 않거나 비활성화되었습니다.
        </p>
      </div>
    );
  }

  // vCard 다운로드는 서버 라우트로 위임 — iOS Safari 가 MIME 으로 .vcf 를 인식해 연락처 앱으로 넘김.
  const vcardHref = `/profile/${encodeURIComponent(card.slug)}/vcard`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* 회사 로고 */}
        <div className="flex justify-center mb-6">
          <div className="relative h-12 w-40">
            <Image
              src={COMPANY_INFO.logoUrl}
              alt={COMPANY_INFO.name}
              fill
              sizes="160px"
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* 카드 본체 */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* 상단 그라데이션 + 사진 */}
          <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 px-6 pt-10 pb-20">
            <div className="text-center text-white">
              <p className="text-xs uppercase tracking-widest opacity-80">
                {COMPANY_INFO.nameKo}
              </p>
            </div>
          </div>

          {/* 프로필 사진 (있을 때만) — 헤더에 겹쳐서 */}
          <div className="relative px-6 -mt-16">
            <div className="flex flex-col items-center">
              {card.photoUrl ? (
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-200">
                  <img
                    src={card.photoUrl}
                    alt={card.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-4xl font-bold text-slate-500">
                  {card.name.slice(0, 1)}
                </div>
              )}

              {/* 이름 / 직함 */}
              <h1 className="mt-4 text-2xl font-bold text-slate-900">{card.name}</h1>
              {card.nameEn && (
                <p className="text-sm text-slate-500 mt-0.5">{card.nameEn}</p>
              )}
              {(card.department || card.title) && (
                <p className="mt-2 text-sm text-slate-600">
                  {[card.department, card.title].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>

          {/* 핵심 CTA — 가장 눈에 띄게 */}
          <div className="px-6 pt-6">
            <a
              href={vcardHref}
              download={`${card.slug}.vcf`}
              className="flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl bg-blue-600 text-white font-bold text-base shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-[0.98] transition-all"
            >
              <Download className="w-5 h-5" />
              연락처 스마트폰에 저장하기
            </a>
            <p className="text-center text-xs text-slate-400 mt-2">
              iOS Safari · Android Chrome 자동 인식
            </p>
          </div>

          {/* 상세 정보 */}
          <div className="px-6 py-6 space-y-1 divide-y divide-slate-100">
            <a
              href={`tel:${card.phone}`}
              className="flex items-center gap-4 py-4 hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">휴대폰</p>
                <p className="text-sm font-medium text-slate-900 truncate">{card.phone}</p>
              </div>
            </a>

            {card.phoneOffice && (
              <a
                href={`tel:${card.phoneOffice}`}
                className="flex items-center gap-4 py-4 hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-400">사무실</p>
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {card.phoneOffice}
                  </p>
                </div>
              </a>
            )}

            <a
              href={`mailto:${card.email}`}
              className="flex items-center gap-4 py-4 hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">이메일</p>
                <p className="text-sm font-medium text-slate-900 truncate">{card.email}</p>
              </div>
            </a>

            <div className="flex items-start gap-4 py-4 px-2 -mx-2">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">회사 주소</p>
                <p className="text-sm font-medium text-slate-900">{COMPANY_INFO.address}</p>
                {COMPANY_INFO.addressEn && (
                  <p className="text-xs text-slate-500 mt-0.5">{COMPANY_INFO.addressEn}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} {COMPANY_INFO.name}
        </p>
      </div>
    </div>
  );
}

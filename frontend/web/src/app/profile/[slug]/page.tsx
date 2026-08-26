'use client';

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Download,
  Mail,
  MapPin,
  Phone,
  Building2,
  MessageCircle,
  Loader2,
} from 'lucide-react';
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
      <div className="min-h-screen bg-cdc-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cdc-500" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-cdc-50 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-cdc-950 mb-2">Profile Not Found</h1>
        <p className="text-cdc-800/60">
          The requested profile does not exist or has been disabled.
        </p>
      </div>
    );
  }

  // vCard 다운로드는 서버 라우트로 위임 — iOS Safari 가 MIME 으로 .vcf 를 인식해 연락처 앱으로 넘김.
  const vcardHref = `/profile/${encodeURIComponent(card.slug)}/vcard`;

  // 기존에 저장된 데이터에 하이픈이 들어있을 수 있어 표시 단에서도 제거 (어드민 입력은 이미 차단됨)
  const displayPhone = card.phone.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto">
        {/*
          듀오톤 히어로.
          사진은 흰 배경 컷아웃이라 mix-blend-multiply 로 배경을 브랜드 그라데이션에 녹인다.
          left/top/width 는 의도적으로 중앙정렬이 아니다 — 인물을 중앙보다 살짝 오른쪽에 두는
          시안을 그대로 옮긴 값이며, %로 잡아 카드 폭이 달라져도 같은 비율로 유지된다.
          (중앙정렬이면 left 가 -30.9%; 여기서는 -24.6% 로 그만큼 오른쪽으로 밀려 있다)
        */}
        <div className="relative w-full aspect-3/4 overflow-hidden bg-[linear-gradient(160deg,#E5F0F0EB,#AFCDCEEB,#54B7BD)]">
          {card.photoUrl ? (
            <img
              src={card.photoUrl}
              alt={card.name}
              className="absolute left-[-24.6%] top-[-18.7%] w-[161.8%] max-w-none h-auto mix-blend-multiply"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[120px] font-bold text-white/45">
              {card.name.slice(0, 1)}
            </div>
          )}

          {/* 하단 스크림 — 이름/로고 가독성 확보 */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,rgba(10,51,57,0)_0%,#273D3FEB)]" />

          <div className="absolute top-[22px] inset-x-6 text-center">
            <p className="text-[13px] font-extrabold tracking-[0.3em] indent-[0.3em] text-white">
              {COMPANY_INFO.brandLine.toUpperCase()}
            </p>
          </div>

          {/* 로고는 사진 오른쪽 아래, 이름 블록 맞은편 */}
          <Image
            src={COMPANY_INFO.logoWhiteUrl}
            alt={COMPANY_INFO.name}
            width={52}
            height={47}
            className="absolute right-6 bottom-7 w-[52px] h-[47px] object-contain"
            priority
          />

          <div className="absolute left-6 right-[90px] bottom-[26px]">
            <h1 className="text-[40px] font-extrabold tracking-[-0.02em] text-white leading-[1.02]">
              {card.name.split(' ').map((word, i) => (
                <span key={i} className="block">
                  {word}
                </span>
              ))}
            </h1>
            {(card.department || card.title) && (
              <div className="mt-2.5 flex items-center gap-2.5">
                <div className="w-[26px] h-0.5 bg-white/60" />
                <p className="text-xs font-semibold tracking-[0.14em] text-white/90">
                  {[card.department, card.title].filter(Boolean).join(' · ')}
                </p>
              </div>
            )}
            {card.nameEn && (
              <p className="mt-1.5 text-base font-light tracking-[0.06em] text-white/65">
                {card.nameEn}
              </p>
            )}
          </div>
        </div>

        {/* 핵심 CTA */}
        <div className="px-6 pt-[22px]">
          <a
            href={vcardHref}
            download={`${card.slug}.vcf`}
            className="flex items-center justify-center gap-[9px] w-full h-[58px] rounded-[18px] bg-[#228990] text-white text-base font-bold shadow-[0_12px_24px_-8px_rgba(35,180,190,0.6)] hover:bg-cdc-700 active:scale-[0.98] transition-all"
          >
            <Download className="w-5 h-5" />
            Save to Contacts
          </a>
        </div>

        {/* 상세 정보 */}
        <div className="px-6 pt-[22px] pb-6 flex flex-col">
          <a
            href={`tel:${displayPhone.replace(/\s/g, '')}`}
            className="flex items-center gap-4 py-3.5 hover:bg-cdc-50 rounded-xl px-2 -mx-2 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#EBF9FA] flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-cdc-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-cdc-800/55">Mobile</p>
              <p className="text-[15px] font-semibold text-cdc-950 truncate">{displayPhone}</p>
            </div>
          </a>

          {card.kakaoId && (
            <>
              <div className="h-px bg-[#dcedee]" />
              <div className="flex items-center gap-4 py-3.5 px-2 -mx-2">
                <div className="w-10 h-10 rounded-full bg-[#EBF9FA] flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-cdc-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-cdc-800/55">KakaoTalk ID</p>
                  <p className="text-[15px] font-semibold text-cdc-950 truncate">{card.kakaoId}</p>
                </div>
              </div>
            </>
          )}

          <div className="h-px bg-[#dcedee]" />

          <a
            href={`tel:${COMPANY_INFO.officePhone.replace(/\s/g, '')}`}
            className="flex items-center gap-4 py-3.5 hover:bg-cdc-50 rounded-xl px-2 -mx-2 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#EBF9FA] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-cdc-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-cdc-800/55">Office</p>
              <p className="text-[15px] font-semibold text-cdc-950 truncate">
                {COMPANY_INFO.officePhone}
              </p>
            </div>
          </a>

          <div className="h-px bg-[#dcedee]" />

          <a
            href={`mailto:${card.email}`}
            className="flex items-center gap-4 py-3.5 hover:bg-cdc-50 rounded-xl px-2 -mx-2 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#EBF9FA] flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-cdc-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-cdc-800/55">Email</p>
              <p className="text-[15px] font-semibold text-cdc-950 truncate">{card.email}</p>
            </div>
          </a>

          <div className="h-px bg-[#dcedee]" />

          <div className="flex items-start gap-4 py-3.5 px-2 -mx-2">
            <div className="w-10 h-10 rounded-full bg-[#EBF9FA] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-cdc-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-cdc-800/55">Office Address</p>
              <p className="text-sm font-medium text-cdc-950 leading-[1.55] text-pretty">
                {COMPANY_INFO.address}
              </p>
            </div>
          </div>
        </div>

        <p className="pb-8 text-center text-xs text-cdc-800/45">
          © {new Date().getFullYear()} {COMPANY_INFO.brandLine.toUpperCase()}
        </p>
      </div>
    </div>
  );
}

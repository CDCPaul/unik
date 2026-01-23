# 항공권 티켓 자동 생성 시스템 구현 계획

## ✅ 중요 업데이트: PDF 파일 지원으로 변경

**변경 사유**: 실제 항공사에서 제공하는 파일이 HTML이 아닌 PDF 형식

### 주요 변경 사항

1. **파일 형식**: HTML → **PDF**
2. **파싱 방법**: HTML 파싱 → **PDF 텍스트 추출** (pdfjs-dist 사용)
3. **Storage 경로**: `tickets/html/` → `tickets/pdf/`
4. **타입 필드**: `htmlFileName`, `htmlFileUrl` → `pdfFileName`, `pdfFileUrl`

### 추가된 라이브러리
- `pdfjs-dist ^5.4.530`: PDF 텍스트 추출

### 파싱 로직 개선
- PDF에서 추출된 순수 텍스트(Plain Text)를 정규식으로 파싱
- 공백 처리 개선 (PDF는 날짜에 공백이 있을 수 있음: "2024. 10. 27")
- 중복 승객 제거 로직 추가
- 더 넓은 패턴 매칭 (PDF는 HTML 태그가 없음)

---

## 📋 프로젝트 개요

**목표:** 항공사별 HTML 파일을 업로드하여 자동으로 파싱하고, 승객별 맞춤 항공권 티켓 PDF를 생성하는 시스템 구축

**배경:**
- 기존: Google Apps Script + Google Sheets (복잡하고 유지보수 어려움)
- 신규: Next.js + Firebase + TypeScript (현대적이고 확장 가능한 아키텍처)

---

## 🎯 지원 항공사 및 티켓 템플릿

### 확인된 티켓 템플릿
```
frontend/web/public/ticket-templates/
├── JINAIR_RT/          ✅ JIN Air (왕복)
├── JEJUAIR_RT/         ✅ JEJU Air (왕복)
├── AIRBUSAN_RT/        🔜 Air Busan (왕복) - 구현 예정
└── 5J_RT/              🔜 Cebu Pacific (왕복) - 구현 예정
```

### 티켓 템플릿 구조 분석

#### 1. **JEJUAIR_RT** (제주항공)
- **위치:** `public/ticket-templates/JEJUAIR_RT/`
- **기술 스택:** React + Vite + Tailwind CSS
- **컴포넌트 구조:**
  ```
  TicketHeader        → 헤더 (로고)
  NoticeSection       → 주의사항
  PassengerSection    → 승객 정보
  FlightSection       → 항공편 정보
  FareSection         → 요금 정보
  FooterSection       → 푸터
  PrintButton         → 인쇄 버튼
  ```

#### 2. **JINAIR_RT** (진에어)
- **위치:** `public/ticket-templates/JINAIR_RT/`
- **기술 스택:** React + Vite + Tailwind CSS
- **컴포넌트 구조:**
  ```
  TicketHeader        → 헤더 (로고)
  PassengerInfo       → 승객 정보
  Itinerary           → 여정 정보 (왕복 2개 항공편)
  FareInfo            → 요금 정보
  + Footer            → 연락처 정보
  ```

#### 3. **공통 특징**
- ✅ **편집 가능한 템플릿** (EditableInput 컴포넌트 사용)
- ✅ **인쇄 최적화** (`print:` Tailwind 클래스)
- ✅ **React 컴포넌트** (독립적인 Vite 프로젝트)
- ✅ **Figma 디자인 에셋** (로고 이미지 포함)

---

## 🏗️ 시스템 아키텍처

### 기술 스택
- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS
- **Backend:** Firebase (Firestore + Storage + Functions)
- **PDF 생성:** html2canvas + jsPDF (클라이언트 사이드)
- **티켓 렌더링:** React 컴포넌트 (Figma 템플릿 재사용)

### 데이터 흐름
```
[Admin 업로드 HTML] 
    ↓
[클라이언트 파싱] → parseJejuAirHtml() / parseJinAirHtml()
    ↓
[Firestore 저장] → airline-tickets 컬렉션
    ↓
[승객별 티켓 생성]
    ↓
[React 컴포넌트 렌더링] → JEJUAIR_RT / JINAIR_RT 템플릿
    ↓
[PDF 생성] → html2canvas + jsPDF
    ↓
[Firebase Storage 저장] → tickets/pdf/{ticketId}/{passengerName}.pdf
    ↓
[다운로드]
```

---

## 📂 프로젝트 파일 구조

```
frontend/web/
├── public/
│   └── ticket-templates/              # Figma 티켓 템플릿 (독립 프로젝트)
│       ├── JINAIR_RT/
│       │   ├── src/
│       │   │   └── app/
│       │   │       └── components/
│       │   │           ├── TicketHeader.tsx
│       │   │           ├── PassengerInfo.tsx
│       │   │           ├── Itinerary.tsx
│       │   │           └── FareInfo.tsx
│       │   └── assets/
│       └── JEJUAIR_RT/
│           ├── src/
│           │   └── app/
│           │       └── components/
│           │           └── ticket/
│           │               ├── TicketHeader.tsx
│           │               ├── PassengerSection.tsx
│           │               ├── FlightSection.tsx
│           │               └── FareSection.tsx
│           └── assets/
│
├── src/
│   ├── app/
│   │   └── admin/
│   │       └── (dashboard)/
│   │           └── tickets/
│   │               ├── page.tsx               # 목록 페이지
│   │               ├── new/
│   │               │   └── page.tsx           # 신규 생성
│   │               └── [id]/
│   │                   └── page.tsx           # 상세/PDF 생성
│   │
│   ├── components/
│   │   └── admin/
│   │       ├── tickets/
│   │       │   ├── TicketFormJin.tsx         # JIN Air 티켓 폼
│   │       │   ├── TicketFormJeju.tsx        # JEJU Air 티켓 폼
│   │       │   ├── TicketPdfJin.tsx          # JIN Air PDF 템플릿 (Next.js 버전)
│   │       │   └── TicketPdfJeju.tsx         # JEJU Air PDF 템플릿 (Next.js 버전)
│   │       └── Sidebar.tsx                    # 메뉴 추가
│   │
│   └── lib/
│       ├── services/
│       │   └── admin/
│       │       └── tickets.ts                 # CRUD + 파싱 로직
│       └── utils/
│           ├── pdf.ts                         # PDF 생성 유틸리티
│           └── file.ts                        # 파일 검증 유틸리티
│
└── shared/
    └── types/
        └── index.ts                            # AirlineTicket 타입 추가
```

---

## 🔄 구현 전략

### ⚠️ **중요 결정: 티켓 템플릿 통합 방식**

#### **Option A: 독립 프로젝트 유지 + iframe 임베드** (비추천)
- Figma 템플릿을 독립 Vite 프로젝트로 유지
- Admin 페이지에서 iframe으로 로드
- ❌ **단점:** 복잡도 증가, postMessage 통신 필요, 성능 이슈

#### **Option B: Next.js 컴포넌트로 포팅** (✅ **권장**)
- Figma 템플릿의 React 컴포넌트를 Next.js로 포팅
- `src/components/admin/tickets/` 하위로 이동
- Tailwind CSS 스타일 재사용
- ✅ **장점:** 단일 프로젝트, 타입 안전성, 성능, 유지보수 용이

---

## 📋 구현 태스크 (10단계)

### **Phase 1: 기반 작업**

#### ✅ Task 1: 타입 정의 및 Firestore 규칙
- **파일:** `shared/types/index.ts`, `firestore.rules`
- **내용:**
  ```typescript
  export type AirlineType = 'JIN' | 'JEJU' | 'AIRBUSAN' | '5J';
  export type JourneyType = 'round-trip' | 'one-way';
  
  export interface FlightJourney {
    flightNumber: string;
    airline?: string;
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
    flightTime?: string;
  }
  
  export interface TicketPassenger {
    lastName: string;
    firstName: string;
    gender: 'Mr' | 'Ms' | 'Mrs' | 'Miss' | '';
    ticketNumber?: string;
  }
  
  export interface ExtraService {
    name: string;
    data: string;
  }
  
  export interface AirlineTicket {
    id: string;
    airline: AirlineType;
    journeyType: JourneyType;
    reservationNumber: string;
    bookingDate: string;
    agentName: string;
    notes?: string;
    journeys: FlightJourney[];
    passengers: TicketPassenger[];
    extraServices: ExtraService[];
    htmlFileName: string;
    htmlFileUrl?: string;
    pdfFolderUrl?: string;
    pdfUrls?: Record<string, string>;
    createdAt?: Date;
    updatedAt?: Date;
  }
  ```

#### ✅ Task 2: 티켓 서비스 파일 생성
- **파일:** `frontend/web/src/lib/services/admin/tickets.ts`
- **내용:**
  - `uploadTicketHtml(file: File): Promise<string>`
  - `createTicket(ticket): Promise<string>`
  - `getTicket(id): Promise<AirlineTicket | null>`
  - `getAllTickets(): Promise<AirlineTicket[]>`
  - `updateTicket(id, data): Promise<void>`
  - `deleteTicket(id): Promise<void>`

#### ✅ Task 5: Admin 사이드바 메뉴 추가
- **파일:** `frontend/web/src/components/admin/Sidebar.tsx`
- **내용:** Plane 아이콘 + `/admin/tickets` 메뉴 추가

#### ✅ Task 8: PDF 생성 라이브러리 설치
- **명령어:**
  ```powershell
  cd frontend/web
  pnpm add html2canvas jspdf
  pnpm add -D @types/html2canvas
  ```
- **파일:** `frontend/web/src/lib/utils/pdf.ts`
  - `generatePdfFromElement(element, filename): Promise<Blob>`
  - `downloadPdf(blob, filename): void`
  - `uploadPdfToStorage(blob, ticketId, passengerName): Promise<string>`

---

### **Phase 2: HTML 파싱 로직**

#### ✅ Task 3: JEJU Air HTML 파싱
- **파일:** `tickets.ts`
- **함수:**
  - `parseJejuAirHtml(htmlContent: string): Partial<AirlineTicket>`
  - `extractJejuJourneys(htmlContent: string): FlightJourney[]`
  - `parseJejuJourneyContent(content: string): FlightJourney | null`
  - Helper: `getAirportNameByCode()`, `formatDateString()`, `getTerminalNumber()`

#### ✅ Task 4: JIN Air HTML 파싱
- **파일:** `tickets.ts`
- **함수:**
  - `parseJinAirHtml(htmlContent: string): Partial<AirlineTicket>`
  - `extractJinJourneys(htmlContent: string): FlightJourney[]`
  - `parseJinJourneyBlock(block: string[]): FlightJourney | null`
  - `extractJinPassengers(htmlContent: string): TicketPassenger[]`
  - Helper: `formatInvoiceDate()`, `formatTime()`, `stripHtml()`

---

### **Phase 3: Admin UI 구현**

#### ✅ Task 6: 티켓 목록 페이지
- **파일:** `frontend/web/src/app/admin/(dashboard)/tickets/page.tsx`
- **기능:**
  - 티켓 목록 표시 (카드 형식)
  - 항공사별 배지 (JIN: 파란색, JEJU: 주황색)
  - 예약 번호, 여정 수, 승객 수 표시
  - 생성 날짜 표시
  - "신규 티켓 생성" 버튼 → `/admin/tickets/new`
  - 편집/삭제 버튼

#### ✅ Task 7: 티켓 생성 페이지
- **파일:** `frontend/web/src/app/admin/(dashboard)/tickets/new/page.tsx`
- **기능:**
  1. 항공사 선택 (JIN / JEJU)
  2. HTML 파일 업로드
  3. 파일 파싱 (클라이언트 사이드)
  4. 파싱 결과 표시
  5. 추가 정보 입력:
     - Agent Name
     - Notes
     - Extra Service (4개)
  6. 저장 → Firestore
  7. 목록 페이지로 이동

---

### **Phase 4: 티켓 템플릿 포팅 및 PDF 생성**

#### 🆕 Task 9: Figma 티켓 템플릿을 Next.js 컴포넌트로 포팅

##### **9-1: JEJU Air 템플릿 포팅**
- **소스:** `public/ticket-templates/JEJUAIR_RT/src/app/components/ticket/`
- **대상:** `src/components/admin/tickets/jeju/`
- **포팅할 컴포넌트:**
  ```
  TicketHeader.tsx        → 로고 헤더
  NoticeSection.tsx       → 주의사항
  PassengerSection.tsx    → 승객 정보
  FlightSection.tsx       → 항공편 정보 (왕복 2개)
  FareSection.tsx         → 요금 정보
  FooterSection.tsx       → 푸터
  ```
- **변경 사항:**
  - `figma:asset/` import → `/ticket-templates/JEJUAIR_RT/assets/` 경로로 변경
  - EditableInput 제거 (props로 데이터 주입)
  - Vite 관련 설정 제거
  - Next.js Image 컴포넌트 사용

##### **9-2: JIN Air 템플릿 포팅**
- **소스:** `public/ticket-templates/JINAIR_RT/src/app/components/`
- **대상:** `src/components/admin/tickets/jin/`
- **포팅할 컴포넌트:**
  ```
  TicketHeader.tsx        → 로고 헤더
  PassengerInfo.tsx       → 승객 정보
  Itinerary.tsx           → 여정 정보
  FareInfo.tsx            → 요금 정보
  ```

##### **9-3: 통합 PDF 템플릿 컴포넌트 생성**
- **파일:** `src/components/admin/tickets/TicketPdfJeju.tsx`
  ```tsx
  import { TicketHeader } from './jeju/TicketHeader';
  import { PassengerSection } from './jeju/PassengerSection';
  import { FlightSection } from './jeju/FlightSection';
  import { FareSection } from './jeju/FareSection';
  import type { AirlineTicket, TicketPassenger } from '@unik/shared/types';
  
  interface Props {
    ticket: AirlineTicket;
    passenger: TicketPassenger;
  }
  
  export default function TicketPdfJeju({ ticket, passenger }: Props) {
    return (
      <div className="w-[210mm] min-h-[297mm] bg-white p-12">
        <TicketHeader />
        <PassengerSection passenger={passenger} booking={ticket.reservationNumber} />
        <FlightSection journeys={ticket.journeys} />
        <FareSection 
          agentName={ticket.agentName} 
          bookingDate={ticket.bookingDate}
          notes={ticket.notes}
          extraServices={ticket.extraServices}
        />
      </div>
    );
  }
  ```

- **파일:** `src/components/admin/tickets/TicketPdfJin.tsx`
  ```tsx
  import { TicketHeader } from './jin/TicketHeader';
  import { PassengerInfo } from './jin/PassengerInfo';
  import { Itinerary } from './jin/Itinerary';
  import { FareInfo } from './jin/FareInfo';
  import type { AirlineTicket, TicketPassenger } from '@unik/shared/types';
  
  interface Props {
    ticket: AirlineTicket;
    passenger: TicketPassenger;
  }
  
  export default function TicketPdfJin({ ticket, passenger }: Props) {
    return (
      <div className="w-[210mm] min-h-[297mm] bg-white p-10">
        <TicketHeader />
        <PassengerInfo 
          name={`${passenger.lastName} / ${passenger.firstName}`}
          title={passenger.gender}
          bookingRef={ticket.reservationNumber}
          ticketNumber={passenger.ticketNumber || ''}
        />
        <Itinerary flights={ticket.journeys} />
        <FareInfo 
          agentName={ticket.agentName}
          dateOfIssue={ticket.bookingDate}
          notes={ticket.notes}
          extraServices={ticket.extraServices}
        />
      </div>
    );
  }
  ```

#### ✅ Task 10: 티켓 상세 페이지 및 PDF 생성
- **파일:** `frontend/web/src/app/admin/(dashboard)/tickets/[id]/page.tsx`
- **기능:**
  1. 티켓 정보 로드 및 표시
  2. 승객 목록 표시
  3. 승객별 "PDF 생성" 버튼
  4. "전체 PDF 생성" 버튼
  5. PDF 생성 프로세스:
     ```typescript
     const handleGeneratePdf = async (passenger: TicketPassenger) => {
       // 1. 숨겨진 div에 TicketPdf 컴포넌트 렌더링
       const container = document.createElement('div');
       container.style.position = 'fixed';
       container.style.left = '-9999px';
       document.body.appendChild(container);
       
       const root = ReactDOM.createRoot(container);
       const TicketPdf = ticket.airline === 'JIN' 
         ? TicketPdfJin 
         : TicketPdfJeju;
       
       root.render(<TicketPdf ticket={ticket} passenger={passenger} />);
       
       // 2. 렌더링 대기
       await new Promise(resolve => setTimeout(resolve, 500));
       
       // 3. PDF 생성
       const pdfBlob = await generatePdfFromElement(
         container.firstChild as HTMLElement,
         `${passenger.lastName}_${passenger.firstName}.pdf`
       );
       
       // 4. Firebase Storage 업로드
       const pdfUrl = await uploadPdfToStorage(pdfBlob, ticket.id, 
         `${passenger.lastName}_${passenger.firstName}`);
       
       // 5. Firestore 업데이트
       await updateTicket(ticket.id, {
         pdfUrls: {
           ...ticket.pdfUrls,
           [`${passenger.lastName}_${passenger.firstName}`]: pdfUrl,
         },
       });
       
       // 6. 다운로드
       downloadPdf(pdfBlob, `${passenger.lastName}_${passenger.firstName}.pdf`);
       
       // 7. 정리
       root.unmount();
       document.body.removeChild(container);
     };
     ```
  6. 진행률 표시 (전체 PDF 생성 시)
  7. 생성된 PDF 다운로드 링크 표시

---

## 🔧 기술적 고려사항

### 1. 티켓 템플릿 포팅 시 주의사항

#### **import 경로 변경**
```typescript
// Before (Vite + Figma)
import jejuLogo from 'figma:asset/357c66164e62cff3f167515732347d10c9b5bd0e.png';

// After (Next.js)
import jejuLogo from '/ticket-templates/JEJUAIR_RT/assets/logo.png';
// 또는
import Image from 'next/image';
<Image src="/ticket-templates/JEJUAIR_RT/assets/logo.png" ... />
```

#### **EditableInput 제거**
```typescript
// Before (편집 가능 템플릿)
<EditableInput 
  value={passenger.name}
  onChange={(value) => handleChange('name', value)}
/>

// After (props 기반)
interface Props {
  passenger: TicketPassenger;
}

function PassengerSection({ passenger }: Props) {
  return <div>{passenger.lastName} / {passenger.firstName}</div>;
}
```

#### **Tailwind CSS 스타일 유지**
- 기존 Figma 템플릿의 Tailwind 클래스를 그대로 사용
- `print:` 유틸리티 클래스 활용 (인쇄 최적화)
- A4 크기: `w-[210mm] min-h-[297mm]`

### 2. PDF 생성 최적화

#### **렌더링 최적화**
- 숨겨진 div에서 렌더링 (`position: fixed; left: -9999px`)
- 이미지 로딩 대기 (500ms timeout)
- 고해상도 캡처 (`scale: 2` in html2canvas)

#### **파일 크기 최적화**
- PNG → JPEG 변환 (이미지 압축)
- 불필요한 여백 제거
- 폰트 서브셋 사용

### 3. 파싱 로직 견고성

#### **에러 핸들링**
```typescript
try {
  const parsedData = parseJejuAirHtml(htmlContent);
  if (!parsedData.reservationNumber) {
    throw new Error('예약 번호를 찾을 수 없습니다.');
  }
  // ...
} catch (error) {
  console.error('HTML 파싱 실패:', error);
  alert('파일 형식이 올바르지 않습니다. JEJU Air HTML 파일을 확인해주세요.');
}
```

#### **HTML 구조 변경 대응**
- 정규식 대신 DOMParser 사용 (선택 사항)
- 여러 패턴을 시도하는 fallback 로직
- 파싱 실패 시 수동 입력 옵션 제공

---

## 📊 데이터베이스 스키마

### Firestore 컬렉션: `airline-tickets`

```typescript
{
  id: "jin-DEJNY2-1705824000000",
  airline: "JIN",
  journeyType: "round-trip",
  reservationNumber: "DEJNY2",
  bookingDate: "20 AUG 2024",
  agentName: "Cebu Direct Club Phil. Travel & Tours, Inc.",
  notes: "CEF",
  
  journeys: [
    {
      flightNumber: "LJ 062",
      airline: "LJ",
      departureAirportCode: "CEB",
      departureAirportName: "CEBU",
      departureDate: "8 SEP 2024",
      departureTime: "01:20",
      departureTerminal: "2",
      arrivalAirportCode: "PUS",
      arrivalAirportName: "BUSAN",
      arrivalDate: "8 SEP 2024",
      arrivalTime: "06:35",
      arrivalTerminal: "2",
      bookingClass: "Q",
      baggageAllowance: "15kg"
    },
    {
      flightNumber: "LJ 061",
      // ... 오는편 정보
    }
  ],
  
  passengers: [
    {
      lastName: "KIM",
      firstName: "JIHWAN",
      gender: "Mr",
      ticketNumber: ""
    }
  ],
  
  extraServices: [
    { name: "Seat Selection", data: "40A, 40B" },
    { name: "Baggage", data: "+10kg" },
    { name: "", data: "" },
    { name: "", data: "" }
  ],
  
  htmlFileName: "jinair_booking_20240820.html",
  htmlFileUrl: "https://storage.googleapis.com/.../jinair_booking_20240820.html",
  
  pdfUrls: {
    "KIM_JIHWAN": "https://storage.googleapis.com/.../KIM_JIHWAN.pdf",
    "LEE_MINHO": "https://storage.googleapis.com/.../LEE_MINHO.pdf"
  },
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🚀 구현 순서

### Week 1: 기반 작업
- [x] Task 1: 타입 정의
- [x] Task 2: 서비스 파일 생성
- [x] Task 5: 사이드바 메뉴
- [x] Task 8: PDF 라이브러리 설치

### Week 2: 파싱 로직
- [ ] Task 3: JEJU Air 파싱
- [ ] Task 4: JIN Air 파싱
- [ ] 실제 HTML 파일로 테스트

### Week 3: Admin UI
- [ ] Task 6: 목록 페이지
- [ ] Task 7: 생성 페이지
- [ ] UI/UX 개선

### Week 4: 티켓 템플릿 포팅 & PDF 생성
- [ ] Task 9-1: JEJU Air 템플릿 포팅
- [ ] Task 9-2: JIN Air 템플릿 포팅
- [ ] Task 9-3: PDF 템플릿 컴포넌트 생성
- [ ] Task 10: 상세 페이지 + PDF 생성
- [ ] 통합 테스트

---

## 🔜 향후 확장

### 추가 항공사 지원
- **Air Busan (AIRBUSAN_RT):** 동일한 패턴으로 파싱 함수 추가
- **Cebu Pacific (5J_RT):** 동일한 패턴으로 파싱 함수 추가

### 기능 개선
- [ ] 일괄 HTML 업로드 (여러 파일 한 번에)
- [ ] 티켓 템플릿 커스터마이징 (관리자 설정)
- [ ] 이메일 전송 (승객에게 PDF 자동 발송)
- [ ] 통계 대시보드 (항공사별, 기간별)

---

## 📝 참고 자료

### 기존 Google Apps Script 로직
- 예약 번호, 예약 날짜 추출
- 여정 정보 파싱 (왕복/편도)
- 승객 정보 추출
- 공항 코드 매핑
- 터미널 정보 할당

### Figma 디자인
- **JEJUAIR_RT:** `public/ticket-templates/JEJUAIR_RT/`
- **JINAIR_RT:** `public/ticket-templates/JINAIR_RT/`
- Figma 파일: 디자이너에게 요청

### 기술 문서
- [html2canvas Documentation](https://html2canvas.hertzen.com/)
- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Firebase Storage](https://firebase.google.com/docs/storage)

---

## ✅ 검증 체크리스트

### 파싱 테스트
- [ ] JEJU Air HTML 파일 파싱 성공
- [ ] JIN Air HTML 파일 파싱 성공
- [ ] 왕복 여정 정확히 추출
- [ ] 편도 여정 정확히 추출
- [ ] 승객 정보 정확히 추출

### UI 테스트
- [ ] 티켓 목록 표시
- [ ] HTML 파일 업로드
- [ ] 파싱 결과 표시
- [ ] 티켓 저장
- [ ] 티켓 편집
- [ ] 티켓 삭제

### PDF 생성 테스트
- [ ] 단일 승객 PDF 생성
- [ ] 전체 승객 PDF 생성
- [ ] PDF 품질 확인 (해상도, 레이아웃)
- [ ] Firebase Storage 업로드
- [ ] PDF 다운로드

### 통합 테스트
- [ ] 전체 워크플로우 (업로드 → 파싱 → 저장 → PDF 생성)
- [ ] 여러 항공사 동시 처리
- [ ] 다수 승객 처리 (10명 이상)
- [ ] 에러 핸들링

---

## 🎯 성공 기준

1. ✅ **기능 완성도**
   - HTML 파일 업로드 및 자동 파싱
   - 승객별 PDF 자동 생성
   - Firebase Storage 자동 저장

2. ✅ **사용자 경험**
   - 직관적인 UI
   - 빠른 처리 속도 (1승객당 < 5초)
   - 명확한 에러 메시지

3. ✅ **코드 품질**
   - TypeScript 타입 안전성
   - 기존 프로젝트 패턴 준수
   - 유지보수 가능한 구조

4. ✅ **확장성**
   - 새로운 항공사 추가 용이
   - 티켓 템플릿 변경 용이
   - 기능 추가 용이

---

## 📞 문의

**개발자:** Your Name
**이메일:** your.email@example.com
**프로젝트:** CBM - KBL All-Star 2026 Tour

---

**Last Updated:** 2026-01-20
**Version:** 1.0.0


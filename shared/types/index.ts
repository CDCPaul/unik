// 웹 전용 레거시 타입 (문의, 명함). 투어 도메인 타입은 shared/domain 에 있다.

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  emailNotificationSent?: boolean;
  emailNotificationError?: string;
  createdAt?: Date;
}

// NFC Business Card (모바일 명함)

export interface BusinessCard {
  id: string;               // Firestore doc ID === slug
  slug: string;             // URL slug, e.g. "gildong-hong" — /profile/{slug}
  name: string;             // 표시 이름 (한글 또는 영문). vCard FN에 사용.
  nameEn?: string;          // 영문 이름 (선택). 있으면 vCard FN 부보조/N에 활용.
  familyName?: string;      // vCard N의 성 (선택, 미입력 시 자동 추정)
  givenName?: string;       // vCard N의 이름 (선택, 미입력 시 자동 추정)
  department?: string;      // 부서
  title?: string;           // 직함
  phone: string;            // 휴대폰
  kakaoId?: string;         // 카카오톡 ID (선택). 명함에서 휴대폰과 사무실 전화 사이에 표시.
  email: string;
  /** 사무실 전화 (선택). 비어 있으면 COMPANY_INFO.officePhone 을 사용. */
  officePhone?: string;
  /** 사무실 주소 (선택). 비어 있으면 COMPANY_INFO.address 를 사용. */
  officeAddress?: string;
  photoUrl?: string;        // Firebase Storage URL (선택)
  isActive: boolean;        // 비활성 시 /profile/{slug} 접근 차단
  order: number;            // 어드민 목록 정렬용
  createdAt?: Date;
  updatedAt?: Date;
}

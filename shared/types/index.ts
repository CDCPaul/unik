// ========================================
// Tour & Player Types for KBL All-Star 2026
// ========================================

export interface Player {
  id: string;
  name: string;
  nameKorean?: string;
  number: number;
  position: 'Guard' | 'Forward' | 'Center';
  height: string;
  team: string;
  thumbnailUrl: string;      // Grid용 작은 사진 (300x400 권장)
  photoUrl: string;          // 상세 페이지용 큰 사진 (900x1200 권장)
  actionPhotoUrl?: string;   // 액션 샷 (선택, 1800x1200 권장)
  bio: string;
  achievements: string[];
  highlightVideoUrl?: string;
  stats?: {
    ppg: number;
    apg: number;
    rpg: number;
  };
  hometown: string;
  isAllStar: boolean;
  allStarYear: number;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ItineraryDay {
  day: number;
  date: string;
  title: string;
  activities: string[];
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  highlight?: boolean;
}

export interface FlightRoute {
  id: string;
  origin: string; // e.g., "Manila (MNL)"
  destination: string; // e.g., "Incheon (ICN)"
  airline: string; // e.g., "Korean Air"
  outbound: {
    flightNumber: string;
    departureTime: string; // e.g., "23:30"
    arrivalTime: string; // e.g., "05:00+1"
  };
  inbound: {
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
  };
}

export interface TourPackage {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  dates: {
    departure: string;
    return: string;
  };
  gameInfo: {
    date: string;
    venue: string;
    matchup: string;
    description: string;
  };
  flightRoutes: FlightRoute[];
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  pricing: {
    adult: number;
    child: number;
    currency: 'PHP' | 'USD' | 'KRW';
  };
  thumbnailUrl: string;
  galleryUrls: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
  category: 'game' | 'tour' | 'accommodation' | 'food' | 'other';
  order: number;
  createdAt?: Date;
}

export interface CompanyInfo {
  id: string;
  brandName: string;
  logoUrl: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  contactViber: string;
  officeAddress: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  updatedAt?: Date;
}

// Registration types (기존)
export type RegistrationStatus = 'new' | 'contacted' | 'confirmed' | 'cancelled';

export interface Registration {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  passportName: string;
  nationality: string;
  adultsCount: number;
  childrenCount: number;
  specialRequests?: string;
  status: RegistrationStatus;
  emailNotificationSent?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RegistrationForm {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  passportName: string;
  nationality: string;
  adultsCount: number;
  childrenCount: number;
  specialRequests?: string;
}

// Navigation & Theme types (기존)
export interface NavItem {
  id: string;
  label: string;
  href: string;
  isVisible: boolean;
  order: number;
}

export interface ThemeColors {
  pageBg: string;
  navbarBg: string;
  cardBg: string;
  footerBg: string;
  headingText: string;
  bodyText: string;
  mutedText: string;
  primaryBtnBg: string;
  primaryBtnText: string;
  primaryBtnHoverBg: string;
  secondaryBtnBg: string;
  secondaryBtnText: string;
  secondaryBtnBorder: string;
  accentColor: string;
  goldColor: string;
}

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
  hometown: string;
  dateOfBirth?: string; // Optional date of birth
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
  isAllStar: boolean;
  allStarYear: number;
  order: number;
  productIds?: string[]; // ['courtside', 'cherry-blossom']
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
  imageUrl?: string; // Image for highlight day (displayed in Main Event section)
  /**
   * Optional per-day gallery images for the itinerary page.
   * Max 3 images recommended (enforced in admin UI).
   */
  galleryImageUrls?: string[];
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

export interface TourDeparture {
  id: string;
  departureDate: string; // e.g., "2026-01-15"
  returnDate: string; // e.g., "2026-01-18"
  /**
   * Optional per-origin date overrides (when departure city changes the actual
   * outbound/return calendar dates due to flight times).
   * If present, UI should prefer matching origin entry and fallback to the base dates.
   */
  datesByOrigin?: Array<{
    origin: string; // must match FlightRoute.origin
    departureDate: string;
    returnDate: string;
  }>;
  availableSeats: number;
  status: 'available' | 'limited' | 'sold-out';
  specialNote?: string; // e.g., "Includes All-Star Game"
}

export interface TourPackage {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  
  // Product categorization
  productCategory: 'courtside' | 'cherry-blossom'; // Which product line
  tourType: 'regular' | 'special-event'; // Regular tour or special event
  
  // Legacy support
  productId?: 'courtside' | 'courtside-special' | 'cherry-blossom';
  
  // Multiple departure dates support
  departures: TourDeparture[];
  
  // Legacy single date support (for backward compatibility)
  dates?: {
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
  /**
   * Optional origin-based pricing (e.g., "Manila (MNL)" vs "Cebu (CEB)").
   * If present, UI should prefer a matching origin entry and fallback to `pricing`.
   */
  pricingByOrigin?: Array<{
    origin: string; // must match FlightRoute.origin
    adult: number;
    child: number;
    currency?: 'PHP' | 'USD' | 'KRW'; // defaults to pricing.currency
  }>;
  thumbnailUrl: string;
  galleryUrls: string[];
  heroImageUrl?: string; // Hero image for home page (1920x1080 recommended)
  isActive: boolean;
  isFeatured: boolean;
  isFeaturedOnHome: boolean; // Display on home page hero section
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
  category: 'game' | 'tour' | 'accommodation' | 'food' | 'other';
  productId?: string; // 'courtside', 'cherry-blossom', etc.
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
  /**
   * Controls which product is shown on the public homepage.
   * - 'auto': derive from the featured tour (default)
   * - 'courtside' | 'cherry-blossom' | 'default': force a specific product home
   */
  homeFeaturedProductKey?: 'auto' | HomeProductKey;
  heroTitle?: {
    text: string;
    fontFamily: 'serif' | 'sans-serif' | 'display' | 'monospace';
  };
  homePageMedia?: {
    heroBackgroundByProduct?: Partial<Record<'default' | 'courtside' | 'cherry-blossom', string>>;
  };
  homePageText?: {
    // Hero
    heroBadgeText?: string;
    heroSubtitleText?: string; // If empty, fallback to featured tour subtitle
    primaryCtaText?: string;
    secondaryCtaText?: string;
    tbaText?: string;
    // Hero Quick Info
    quickInfoDateLabel?: string;
    quickInfoVenueLabel?: string;
    // Featured Players section
    featuredPlayersHeading?: string;
    featuredPlayersSubheading?: string;
    featuredPlayersCtaText?: string;
    // Gallery section
    galleryHeading?: string;
    gallerySubheading?: string;
    galleryCtaText?: string;
    // Bottom CTA section
    ctaHeading?: string;
    ctaBody?: string;
    ctaButtonText?: string;
  };
  updatedAt?: Date;
}

// ========================================
// Home Page Builder (B안) Types
// ========================================

export type HomeProductKey = 'default' | 'courtside' | 'cherry-blossom';

export type HomeSectionType =
  | 'playersGrid'
  | 'galleryPreview'
  | 'highlightsFromItinerary'
  | 'cta'
  | 'spacer';

export interface HomeHeroConfig {
  badgeText?: string;
  titleText?: string;
  subtitleText?: string;
  badgeFontFamily?: 'inherit' | 'serif' | 'sans-serif' | 'display' | 'monospace' | 'korean-sans';
  titleFontFamily?: 'inherit' | 'serif' | 'sans-serif' | 'display' | 'monospace' | 'korean-sans';
  subtitleFontFamily?: 'inherit' | 'serif' | 'sans-serif' | 'display' | 'monospace' | 'korean-sans';
  primaryCtaText?: string;
  secondaryCtaText?: string;
  primaryCtaFontFamily?: 'inherit' | 'serif' | 'sans-serif' | 'display' | 'monospace' | 'korean-sans';
  secondaryCtaFontFamily?: 'inherit' | 'serif' | 'sans-serif' | 'display' | 'monospace' | 'korean-sans';
  bgDesktopUrl?: string;
  bgMobileUrl?: string;
}

export interface HomeSectionBase {
  id: string;
  type: HomeSectionType;
  enabled: boolean;
  order: number;
}

export interface HomePlayersGridSection extends HomeSectionBase {
  type: 'playersGrid';
  props?: {
    heading?: string;
    subheading?: string;
    ctaText?: string;
    maxItems?: number;
    headingFontFamily?: 'inherit' | 'serif' | 'sans-serif' | 'display' | 'monospace' | 'korean-sans';
    subheadingFontFamily?: 'inherit' | 'serif' | 'sans-serif' | 'display' | 'monospace' | 'korean-sans';
    ctaFontFamily?: 'inherit' | 'serif' | 'sans-serif' | 'display' | 'monospace' | 'korean-sans';
  };
}

export interface HomeGalleryPreviewSection extends HomeSectionBase {
  type: 'galleryPreview';
  props?: {
    heading?: string;
    subheading?: string;
    ctaText?: string;
    maxItems?: number;
    headingFontFamily?: 'inherit' | 'serif' | 'sans-serif' | 'display' | 'monospace' | 'korean-sans';
    subheadingFontFamily?: 'inherit' | 'serif' | 'sans-serif' | 'display' | 'monospace' | 'korean-sans';
    ctaFontFamily?: 'inherit' | 'serif' | 'sans-serif' | 'display' | 'monospace' | 'korean-sans';
  };
}

export interface HomeHighlightsFromItinerarySection extends HomeSectionBase {
  type: 'highlightsFromItinerary';
  props?: {
    heading?: string;
    subheading?: string;
    maxItems?: number;
    onlyHighlighted?: boolean;
    headingFontFamily?: 'inherit' | 'serif' | 'sans-serif' | 'display' | 'monospace' | 'korean-sans';
    subheadingFontFamily?: 'inherit' | 'serif' | 'sans-serif' | 'display' | 'monospace' | 'korean-sans';
  };
}

export interface HomeCtaSection extends HomeSectionBase {
  type: 'cta';
  props?: {
    heading?: string;
    body?: string;
    buttonText?: string;
    headingFontFamily?: 'inherit' | 'serif' | 'sans-serif' | 'display' | 'monospace' | 'korean-sans';
    bodyFontFamily?: 'inherit' | 'serif' | 'sans-serif' | 'display' | 'monospace' | 'korean-sans';
    buttonFontFamily?: 'inherit' | 'serif' | 'sans-serif' | 'display' | 'monospace' | 'korean-sans';
  };
}

export interface HomeSpacerSection extends HomeSectionBase {
  type: 'spacer';
  props?: {
    height?: 'sm' | 'md' | 'lg';
  };
}

export type HomeSection =
  | HomePlayersGridSection
  | HomeGalleryPreviewSection
  | HomeHighlightsFromItinerarySection
  | HomeCtaSection
  | HomeSpacerSection;

export interface HomeConfig {
  version: 1;
  productKey: HomeProductKey;
  hero: HomeHeroConfig;
  sections: HomeSection[];
  updatedAt?: Date;
}

export interface HomeConfigsDoc {
  configs?: Partial<Record<HomeProductKey, HomeConfig>>;
  updatedAt?: Date;
}

// Registration types (기존)
export type RegistrationStatus = 'new' | 'contacted' | 'confirmed' | 'cancelled';

export interface Registration {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  phoneCountryCode?: string; // e.g., "+63"
  phoneLocalNumber?: string; // e.g., "9123456789"
  dateOfBirth: string;
  gender?: 'female' | 'male' | 'non-binary' | 'prefer-not-to-say';
  /**
   * @deprecated We now collect "passport name" via `fullName` (and `firstName`/`lastName`).
   * Kept optional for backward compatibility with existing records.
   */
  passportName?: string;
  nationality: string;
  nationalityCountryCode?: string; // e.g., "PH"
  adultsCount: number;
  childrenCount: number;
  /**
   * Optional pricing snapshot captured at registration time.
   * Helps reporting when pricing varies by origin or changes over time.
   */
  pricingOrigin?: string; // e.g., "Manila (MNL)" / "Cebu (CEB)"
  unitPriceAdult?: number;
  unitPriceChild?: number;
  priceCurrency?: 'PHP' | 'USD' | 'KRW';
  totalPrice?: number;
  
  // Tour selection
  tourId: string; // Selected tour package ID
  tourTitle: string; // Tour title for display
  departureId: string; // Selected departure ID
  departureDate: string; // Selected departure date
  departureOrigin?: string; // e.g., "Manila (MNL)" / "Cebu (CEB)"
  favoritePlayerIds?: string[]; // Optional multi-select
  favoritePlayerNames?: string[]; // Denormalized for easy admin viewing
  
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
  passportName?: string;
  nationality: string;
  adultsCount: number;
  childrenCount: number;
  specialRequests?: string;
}

// Navigation & Theme types (기존)
export interface TabItem {
  id: string;
  label: string;
  path: string; // 'overview', 'schedule', 'players', 'gallery'
  isVisible: boolean;
  order: number;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  isVisible: boolean;
  order: number;
  children?: NavItem[]; // 드롭다운 지원
  tabs?: TabItem[]; // 페이지 내부 탭
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

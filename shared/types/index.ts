// Registration Types
export interface Registration {
  id: string;
  // Applicant Information
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  passportName: string;
  nationality: string;
  // Companions
  adultsCount: number; // 12 years and above
  childrenCount: number; // under 12 years
  // Additional
  specialRequests?: string;
  // Metadata
  status: RegistrationStatus;
  createdAt: Date;
  updatedAt: Date;
  notes?: string; // Admin notes
}

export type RegistrationStatus = 'new' | 'contacted' | 'confirmed' | 'cancelled';

// Player Types
export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  jerseyNumber: number;
  height: string;
  weight: string;
  nationality: string;
  imageUrl: string;
  bio: string;
  stats?: PlayerStats;
  order: number; // For sorting
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerStats {
  pointsPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
}

// Tour Types
export interface TourPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: string;
  startDate: string;
  endDate: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryDay[];
  imageUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: string[];
}

// Content Types (for CMS)
export interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
  order: number;
  createdAt: Date;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

// Info Page Content
export interface InfoSection {
  id: string;
  title: string;
  content: string;
  order: number;
  isActive: boolean;
}


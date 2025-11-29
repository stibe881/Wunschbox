
export type Role = 'PARENT' | 'RELATIVE';

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

export type Category = 'Spielzeug' | 'Kleidung' | 'Bücher' | 'Schule' | 'Sport' | 'Elektronik' | 'Erlebnis' | 'Sonstiges';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface User {
  id: string;
  name: string;
  email: string; // Optional, kept for structure
  role: Role;
  roleDescription?: string; // e.g. "Gotti", "Onkel"
  emailNotificationsEnabled?: boolean; // New setting
}

export interface Child {
  id: string;
  name: string;
  birthDate: string; // ISO Date string YYYY-MM-DD
  gender: Gender;
  createdByUserId: string;
}

export interface Invitation {
  id: string;
  token: string;
  guestName: string;
  guestRoleDescription: string; // e.g. "Gotti", "Opa"
  targetRole: Role; // New: determines if they become a parent or relative
  customMessage?: string; // New: personal message
  createdByUserId: string;
  createdAt: number;
  isUsed: boolean;
}

export interface Gift {
  id: string;
  title: string;
  purpose: string; // e.g., "Für die Schule", "Zum Spielen"
  priceMin: number;
  priceMax: number;
  currency: string;
  imageUrl: string; // Now stores Base64 string
  shopUrl: string;
  childName: string; // Now strictly linked to names, but kept as string for flexibility
  priority: Priority;
  category: Category;
  isGifted: boolean;
  giftedByUserId?: string;
  giftedByUserName?: string;
  createdAt: number;
}

export interface Notification {
  id: string;
  message: string;
  createdAt: number;
  read: boolean;
  forRole: Role;
}

export interface AIGiftSuggestion {
  title: string;
  description: string;
  estimatedPriceRange: string;
}

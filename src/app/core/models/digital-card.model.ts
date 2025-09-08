export interface DigitalCard {
  id: number;
  user_id: number;
  personal_info: PersonalInfo | null;
  contact_info: ContactInfo | null;
  about_info: AboutInfo | null;
  is_active: boolean;
  is_public: boolean;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalInfo {
  id: number;
  digital_card_id: number;
  name: string;
  title?: string;
  location?: string;
  photo?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactInfo {
  id: number;
  digital_card_id: number;
  email?: string;
  phone?: string;
  linkedin?: string;
  website?: string;
  twitter?: string;
  instagram?: string;
  github?: string;
  youtube?: string;
  tiktok?: string;
  whatsapp?: string;
  facebook?: string;
  created_at: string;
  updated_at: string;
}

export interface AboutInfo {
  id: number;
  digital_card_id: number;
  description?: string;
  skills?: string[];
  experience?: number;
  created_at: string;
  updated_at: string;
}

// Interfaces para operaciones CRUD (aligned with Laravel API)
export interface CreateDigitalCardRequest {
  personalInfo: {
    name: string;
    title?: string;
    location?: string;
    photo?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    linkedin?: string;
    website?: string;
    twitter?: string;
    instagram?: string;
    github?: string;
    youtube?: string;
    tiktok?: string;
    whatsapp?: string;
    facebook?: string;
  };
  about?: {
    description?: string;
    skills?: string[];
    experience?: number;
  };
  is_active?: boolean;
  is_public?: boolean;
}

export interface UpdateDigitalCardRequest {
  personalInfo?: {
    name?: string;
    title?: string;
    location?: string;
    photo?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    linkedin?: string;
    website?: string;
    twitter?: string;
    instagram?: string;
    github?: string;
    youtube?: string;
    tiktok?: string;
    whatsapp?: string;
    facebook?: string;
  };
  about?: {
    description?: string;
    skills?: string[];
    experience?: number;
  };
  is_active?: boolean;
  is_public?: boolean;
}

// Interfaces para respuestas API (Laravel Resource structure)
export interface DigitalCardApiResponse {
  data: DigitalCard;
  message: string;
}

export interface DigitalCardListApiResponse {
  data: DigitalCard[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface ImageUploadResponse {
  message: string;
  image_url: string;
  full_url: string;
}

export interface ImageDeleteResponse {
  message: string;
}
export enum RegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WAITLIST = 'WAITLIST',
  CHECKED_IN = 'CHECKED_IN',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface IEvent {
  id: string;
  title: string;
  subtitle?: string;
  poster?: string;
  venue: string;
  date_time: string;
  map_link?: string;
  description?: string;
  registration_start: string;
  registration_end: string;
  approval_required: boolean;
  capacity: number;
  family_allowed: boolean;
  status: EventStatus;
  organiser: { id: string; name: string; logo?: string; website?: string };
  _count: { registrations: number };
}

export interface IRegistration {
  id: string;
  event_id: string;
  status: RegistrationStatus;
  notes?: string;
  family_members?: string[];
  created_at: string;
  event: {
    id: string;
    title: string;
    subtitle?: string;
    poster?: string;
    venue: string;
    date_time: string;
    status: EventStatus;
  };
  category?: { id: string; name: string; color: string };
  qr_pass?: {
    id: string;
    qr_image_url: string;
    is_used: boolean;
    expires_at?: string;
  };
}

export interface IQRPass {
  id: string;
  qr_code: string;
  qr_image_url: string;
  is_used: boolean;
  used_at?: string;
  expires_at?: string;
}

export interface IFamilyMember {
  id: string;
  full_name: string;
  age?: number;
  gender?: string;
  relation?: string;
}

export interface IUserProfile {
  id: string;
  mobile_number: string;
  full_name?: string;
  email?: string;
  age?: number;
  gender?: string;
  city?: string;
  profession?: string;
  profile_photo?: string;
  role: string;
}

export interface ICategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

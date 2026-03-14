// ─────────────────────────────────────────────
//  Enums
// ─────────────────────────────────────────────

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORGANISER = 'ORGANISER',
  SCANNER = 'SCANNER',
  GUEST = 'GUEST',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum RegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WAITLIST = 'WAITLIST',
  CHECKED_IN = 'CHECKED_IN',
}

export enum ScanResult {
  SUCCESS = 'SUCCESS',
  ALREADY_SCANNED = 'ALREADY_SCANNED',
  INVALID_QR = 'INVALID_QR',
  EXPIRED = 'EXPIRED',
  WRONG_GATE = 'WRONG_GATE',
  REJECTED_REGISTRATION = 'REJECTED_REGISTRATION',
}

export enum NotificationType {
  REGISTRATION_RECEIVED = 'REGISTRATION_RECEIVED',
  APPROVAL_GRANTED = 'APPROVAL_GRANTED',
  REGISTRATION_REJECTED = 'REGISTRATION_REJECTED',
  REMINDER_24HR = 'REMINDER_24HR',
  REMINDER_3HR = 'REMINDER_3HR',
  EVENT_LIVE = 'EVENT_LIVE',
  THANK_YOU = 'THANK_YOU',
}

export enum NotificationChannel {
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
}

// ─────────────────────────────────────────────
//  User Types
// ─────────────────────────────────────────────

export interface IUser {
  id: string;
  mobile_number: string;
  full_name?: string;
  email?: string;
  age?: number;
  gender?: string;
  city?: string;
  profession?: string;
  profile_photo?: string;
  role: Role;
  approval_status: ApprovalStatus;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IFamilyMember {
  id: string;
  user_id: string;
  full_name: string;
  age?: number;
  gender?: string;
  relation?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ─────────────────────────────────────────────
//  Event Types
// ─────────────────────────────────────────────

export interface IEvent {
  id: string;
  organiser_id: string;
  title: string;
  subtitle?: string;
  poster?: string;
  venue: string;
  date_time: Date;
  map_link?: string;
  description?: string;
  registration_start: Date;
  registration_end: Date;
  approval_required: boolean;
  capacity: number;
  family_allowed: boolean;
  status: EventStatus;
  created_at: Date;
  updated_at: Date;
}

export interface IEventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  category_id?: string;
  gate_id?: string;
  status: RegistrationStatus;
  family_members?: string[];
  notes?: string;
  reviewed_by?: string;
  reviewed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// ─────────────────────────────────────────────
//  QR Types
// ─────────────────────────────────────────────

export interface IQRPass {
  id: string;
  registration_id: string;
  event_id: string;
  qr_code: string;
  secure_hash: string;
  is_used: boolean;
  used_at?: Date;
  expires_at?: Date;
  created_at: Date;
}

export interface IQRPayload {
  event_id: string;
  registration_id: string;
  secure_hash: string;
  issued_at: number;
}

export interface IScanResponse {
  result: ScanResult;
  message: string;
  attendee_name?: string;
  event_title?: string;
  gate_name?: string;
  checked_in_at?: Date;
}

// ─────────────────────────────────────────────
//  API Response Types
// ─────────────────────────────────────────────

export interface IApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode: number;
}

export interface IPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─────────────────────────────────────────────
//  Auth Types
// ─────────────────────────────────────────────

export interface IJwtPayload {
  sub: string;
  mobile: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface IAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// ============================================================================
// Auth Types
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: number;
  email: string;
  name: string;
  cv_path?: string | null; // Deprecated, use cv_file_path
  cv_file_path?: string | null;
  cv_text?: string | null;
  cover_letter_template?: string | null;
  
  // CV sections
  cv_personal_info?: string | null;
  cv_summary?: string | null;
  cv_technical_skills?: string | null;
  cv_soft_skills?: string | null;
  cv_experience?: string | null;
  cv_projects?: string | null;
  cv_education?: string | null;
  cv_awards?: string | null;
  
  linkedin_url?: string | null;
  profile_summary?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  cv_path?: string; // Deprecated
  cv_file_path?: string;
  cv_text?: string;
  cover_letter_template?: string;
  linkedin_url?: string;
  profile_summary?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// ============================================================================
// Job Offer Types
// ============================================================================

export type ApplicationType = "email" | "portal" | "manual";

export interface JobOffer {
  id: number;
  title: string;
  company: string;
  location?: string | null;
  source: string;
  url?: string | null;
  application_type: ApplicationType;
  application_url?: string | null;
  raw_description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateJobOfferRequest {
  title: string;
  company: string;
  location?: string | null;
  source: string;
  url?: string | null;
  application_type: ApplicationType;
  application_url?: string | null;
  raw_description: string;
}

export interface UpdateJobOfferRequest {
  title?: string;
  company?: string;
  location?: string | null;
  source?: string;
  url?: string | null;
  application_type?: ApplicationType;
  application_url?: string | null;
  raw_description?: string;
}

// ============================================================================
// Job Match Types
// ============================================================================

export interface JobMatch {
  id: number;
  job_offer_id: number;
  score: number;
  reasons?: string | null;
  skills_detected?: string | null;
  red_flags?: string | null;
  created_at: string;
}

export interface AnalyzeJobMatchRequest {
  job_id: number;
}

// ============================================================================
// Application Draft Types
// ============================================================================

export type DraftStatus = "draft" | "ready" | "sent";

export interface ApplicationDraft {
  id: number;
  job_offer_id: number;
  cover_letter_text?: string | null;
  cover_letter_pdf_path?: string | null;
  email_subject?: string | null;
  email_body?: string | null;
  attachments?: string | null;
  status: DraftStatus;
  created_at: string;
  updated_at: string;
}

export interface GenerateDraftRequest {
  job_id: number;
}

export interface UpdateDraftRequest {
  cover_letter_text?: string;
  email_subject?: string;
  email_body?: string;
  attachments?: string;
  status?: DraftStatus;
}

export interface SendDraftRequest {
  draft_id: number;
}

// ============================================================================
// Application Types
// ============================================================================

export type ApplicationChannel = "email" | "portal" | "manual";
export type ApplicationStatus = "pending" | "confirmed" | "rejected";
export type SubmittedBy = "user" | "agent";

export interface Application {
  id: number;
  job_offer_id: number;
  channel: ApplicationChannel;
  portal_type?: string | null;
  submitted_by: SubmittedBy;
  reference_number?: string | null;
  confirmation_file_path?: string | null;
  status: ApplicationStatus;
  sent_at?: string | null;
  next_action_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateApplicationRequest {
  job_offer_id: number;
  channel: ApplicationChannel;
  portal_type?: string | null;
  submitted_by: SubmittedBy;
  reference_number?: string | null;
  confirmation_file_path?: string | null;
  status: ApplicationStatus;
  sent_at?: string | null;
  next_action_date?: string | null;
  notes?: string | null;
}

export interface UpdateApplicationRequest {
  channel?: ApplicationChannel;
  portal_type?: string | null;
  reference_number?: string | null;
  confirmation_file_path?: string | null;
  status?: ApplicationStatus;
  sent_at?: string | null;
  next_action_date?: string | null;
  notes?: string | null;
}

// ============================================================================
// Timeline Types
// ============================================================================

export interface TimelineEvent {
  id: number;
  application_id: number;
  event_type: string;
  description: string;
  event_date: string;
  created_at: string;
}

export interface CreateTimelineEventRequest {
  application_id: number;
  event_type: string;
  description: string;
  event_date: string;
}

// ============================================================================
// Shared / Utility Types
// ============================================================================

export interface ApiError {
  detail: string;
  status?: number;
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

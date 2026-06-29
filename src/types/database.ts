/**
 * Database types — mirrors the Supabase MVP schema (supabase/schema.sql).
 *
 * Hand-typed to keep things light. When the schema settles you can
 * replace this with `supabase gen types typescript` output.
 */

export type Role = 'physio' | 'trainer' | 'client';

export type LinkRole = 'physio' | 'trainer';
export type LinkStatus = 'pending' | 'active' | 'discharged' | 'archived';

export type ProgramStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type BookingType =
  | 'pt_session'
  | 'group_class'
  | 'rehab_session'
  | 'assessment'
  | 'online_session';

export type ConversationType = 'direct' | 'group' | 'practitioner_handoff';
export type ConstraintSeverity = 'hard' | 'soft' | 'advisory';
export type ConstraintStatus = 'active' | 'cleared' | 'expired' | 'superseded';

export interface Profile {
  id: string;
  email: string;
  role: Role;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  locale: string;
  timezone: string;
  onboarding_completed: boolean;
  push_token: string | null;
  consent_version: string | null;
  consent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientProfile {
  user_id: string;
  date_of_birth: string | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  primary_goal: string | null;
  medical_notes: string | null;
  body_type: string | null;
}

export interface TrainerProfile {
  user_id: string;
  certifications: string[] | null;
  specialties: string[] | null;
  session_price: number | null;
  group_class_price: number | null;
  years_experience: number | null;
  accepts_new: boolean;
}

export interface PractitionerLink {
  id: string;
  practitioner_id: string;
  client_id: string;
  role: LinkRole;
  status: LinkStatus;
  linked_at: string;
  notes: string | null;
}

export interface Exercise {
  id: string;
  name: string;
  category: string | null;
  equipment: string[] | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  description: string | null;
  setup_cues: string | null;
  execution_cues: string | null;
  primary_muscles: { muscle: string; contribution: number }[];
  video_url: string | null;
  thumbnail_url: string | null;
  is_system: boolean;
}

export interface ProgramDayExercise {
  exerciseId: string;
  sets: number;
  reps: string;
  rir?: number | null;
  restSeconds?: number;
  tempo?: string | null;
  notes?: string | null;
  warmup?: boolean;
  order: number;
  supersetGroup?: string | null;
}

export interface ProgramDay {
  label: string;
  dayOfWeek: number;
  exercises: ProgramDayExercise[];
}

export interface Program {
  id: string;
  name: string;
  created_by: string;
  assigned_to: string | null;
  focus: string | null;
  phase: string | null;
  duration_weeks: number | null;
  days: ProgramDay[];
  status: ProgramStatus;
  created_at: string;
  updated_at: string;
}

export interface AdherenceLogExercise {
  exerciseId: string;
  setsCompleted: number;
  repsPerSet: number[];
  weightKg: number[];
  rirReported?: number[];
  painReported?: boolean;
  skipped?: boolean;
  skipReason?: string | null;
}

export interface AdherenceEntry {
  id: string;
  client_id: string;
  program_id: string;
  day_index: number;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  exercises_logged: AdherenceLogExercise[];
  previous_hash: string | null;
  entry_hash: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  practitioner_id: string;
  client_id: string | null;
  booking_type: BookingType;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  title: string | null;
  description: string | null;
  price: number | null;
  currency: string;
  location: { type: string; address?: string; meetingUrl?: string } | null;
  notes: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  direct_key: string | null;
  title: string | null;
  created_at: string;
}

export interface ConversationMember {
  conversation_id: string;
  user_id: string;
  role: 'member' | 'admin';
  last_read_at: string | null;
  muted: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'file' | 'system';
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ClinicalConstraint {
  id: string;
  patient_id: string;
  physio_id: string | null;
  constraint_type: string;
  target: string;
  value: string | null;
  severity: ConstraintSeverity;
  body_region: string | null;
  notes: string | null;
  status: ConstraintStatus;
  created_at: string;
  cleared_at: string | null;
}

export type ConstraintEventType =
  | 'created'
  | 'updated'
  | 'cleared'
  | 'delivered'
  | 'enforced'
  | 'acknowledged'
  | 'pain_reported';

export type PainMarkerContext = 'live_session' | 'post_session' | 'standalone';

export interface PainMarker {
  id: string;
  client_id: string;
  pain_score: number;
  body_region: string | null;
  context: PainMarkerContext;
  exercise_id: string | null;
  program_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface ConstraintEvent {
  id: string;
  constraint_id: string;
  patient_id: string;
  event_type: ConstraintEventType;
  actor_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/* ── Supabase generic Database type ───────────────────────────────────── */

type DbRow<T> = T & Record<string, unknown>;
type WithInsert<T> = Partial<T> & Record<string, unknown>;
type WithUpdate<T> = Partial<T> & Record<string, unknown>;

export interface Database {
  public: {
    Tables: {
      profiles: { Row: DbRow<Profile>; Insert: WithInsert<Profile>; Update: WithUpdate<Profile>; Relationships: [] };
      client_profiles: {
        Row: DbRow<ClientProfile>;
        Insert: WithInsert<ClientProfile>;
        Update: WithUpdate<ClientProfile>;
        Relationships: [];
      };
      trainer_profiles: {
        Row: DbRow<TrainerProfile>;
        Insert: WithInsert<TrainerProfile>;
        Update: WithUpdate<TrainerProfile>;
        Relationships: [];
      };
      practitioner_client_links: {
        Row: DbRow<PractitionerLink>;
        Insert: WithInsert<PractitionerLink>;
        Update: WithUpdate<PractitionerLink>;
        Relationships: [];
      };
      exercises: {
        Row: DbRow<Exercise>;
        Insert: WithInsert<Exercise>;
        Update: WithUpdate<Exercise>;
        Relationships: [];
      };
      programs: {
        Row: DbRow<Program>;
        Insert: WithInsert<Program>;
        Update: WithUpdate<Program>;
        Relationships: [];
      };
      adherence_ledger: {
        Row: DbRow<AdherenceEntry>;
        Insert: WithInsert<AdherenceEntry>;
        Update: WithUpdate<AdherenceEntry>;
        Relationships: [];
      };
      bookings: {
        Row: DbRow<Booking>;
        Insert: WithInsert<Booking>;
        Update: WithUpdate<Booking>;
        Relationships: [];
      };
      conversations: {
        Row: DbRow<Conversation>;
        Insert: WithInsert<Conversation>;
        Update: WithUpdate<Conversation>;
        Relationships: [];
      };
      conversation_members: {
        Row: DbRow<ConversationMember>;
        Insert: WithInsert<ConversationMember>;
        Update: WithUpdate<ConversationMember>;
        Relationships: [];
      };
      messages: {
        Row: DbRow<Message>;
        Insert: WithInsert<Message>;
        Update: WithUpdate<Message>;
        Relationships: [];
      };
      clinical_constraints: {
        Row: DbRow<ClinicalConstraint>;
        Insert: WithInsert<ClinicalConstraint>;
        Update: WithUpdate<ClinicalConstraint>;
        Relationships: [];
      };
      constraint_events: {
        Row: DbRow<ConstraintEvent>;
        Insert: WithInsert<ConstraintEvent>;
        Update: WithUpdate<ConstraintEvent>;
        Relationships: [];
      };
      pain_markers: {
        Row: DbRow<PainMarker>;
        Insert: WithInsert<PainMarker>;
        Update: WithUpdate<PainMarker>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_direct_conversation: {
        Args: { other_id: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

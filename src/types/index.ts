export type PlanType = 'free' | 'essenziale' | 'avanzato' | 'maestro'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'free'
export type AppType = 'italianto_app' | 'dialogue_studio' | 'platform'

// ─── Supabase Database Types ──────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          stripe_customer_id?: string | null
          plan_type?: PlanType
        }
        Update: Partial<Omit<UserRow, 'id' | 'created_at'>>
        Relationships: []
      }
      subscriptions: {
        Row: SubscriptionRow
        Insert: {
          id: string
          user_id: string
          status: SubscriptionStatus
          plan_type: PlanType
          currency?: string
          cancel_at_period_end?: boolean
          price_id?: string | null
          billing_interval?: 'month' | 'year' | null
          amount?: number | null
          current_period_start?: string | null
          current_period_end?: string | null
          canceled_at?: string | null
          tutor_minutes_used?: number
          tutor_minutes_reset_at?: string | null
          dialogues_used?: number
          audio_used?: number
          usage_reset_at?: string | null
          coupon_id?: string | null
        }
        Update: Partial<Omit<SubscriptionRow, 'id' | 'created_at'>>
        Relationships: []
      }
      usage_metrics: {
        Row: UsageMetricRow
        Insert: Omit<UsageMetricRow, 'id' | 'recorded_at'>
        Update: never
        Relationships: []
      }
      coupons: {
        Row: CouponRow
        Insert: Omit<CouponRow, 'id' | 'created_at' | 'times_used'>
        Update: Partial<Omit<CouponRow, 'id' | 'created_at'>>
        Relationships: []
      }
      app_sessions: {
        Row: AppSessionRow
        Insert: Omit<AppSessionRow, 'id'>
        Update: Partial<Omit<AppSessionRow, 'id'>>
        Relationships: []
      }
      lessons: {
        Row: LessonRow
        Insert: Omit<LessonRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<LessonRow, 'id' | 'created_at'>>
        Relationships: []
      }
      lesson_progress: {
        Row: LessonProgressRow
        Insert: Omit<LessonProgressRow, 'id' | 'created_at'>
        Update: Partial<Omit<LessonProgressRow, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export interface UserRow {
  id: string                    // Clerk user ID
  email: string
  full_name: string | null
  avatar_url: string | null
  stripe_customer_id: string | null
  plan_type: PlanType
  created_at: string
  updated_at: string
}

export interface SubscriptionRow {
  id: string                    // Stripe subscription ID
  user_id: string
  status: SubscriptionStatus
  plan_type: PlanType
  price_id: string | null
  billing_interval: 'month' | 'year' | null
  amount: number | null         // en centavos
  currency: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  tutor_minutes_used: number
  tutor_minutes_reset_at: string | null
  dialogues_used: number
  audio_used: number
  usage_reset_at: string | null
  coupon_id: string | null
  created_at: string
  updated_at: string
}

export interface UsageMetricRow {
  id: string
  user_id: string
  app: AppType
  action: string               // 'translation', 'conjugation', 'pronunciation', 'dialogue', 'audio', 'tutor_session'
  metadata: Record<string, unknown> | null
  recorded_at: string
}

export interface CouponRow {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  currency: string | null
  applicable_plans: PlanType[]
  max_uses: number | null
  times_used: number
  expires_at: string | null
  is_active: boolean
  created_by: string
  created_at: string
}

export interface AppSessionRow {
  id: string
  user_id: string
  app: AppType
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  ip_address: string | null
  user_agent: string | null
}

// ─── API Response Types ────────────────────────────────────────────────────
export interface ApiResponse<T = void> {
  data?: T
  error?: string
  message?: string
}

// ─── Admin Dashboard Types ─────────────────────────────────────────────────
export interface AdminStats {
  totalUsers: number
  activeSubscribers: number
  mrr: number
  arr: number
  churnRate: number
  newUsersThisMonth: number
  revenueThisMonth: number
  planDistribution: {
    plan: PlanType
    count: number
    percentage: number
  }[]
  appUsage: {
    app: AppType
    sessions: number
    avgDuration: number
  }[]
  revenueTimeline: {
    month: string
    revenue: number
    subscribers: number
  }[]
}

export interface AdminUser extends UserRow {
  subscription: SubscriptionRow | null
  totalSessions: number
  lastActiveAt: string | null
}

// ─── Lesson Types ─────────────────────────────────────────────────────────────
export type LessonLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type LessonStatus = 'draft' | 'published'
export type LessonProgressStatus = 'in_progress' | 'failed' | 'passed'
export type LessonLanguage = 'es' | 'en' | 'it'

export interface VocabularyItem {
  word: string
  translation: string
  example?: string
}

// ─── Exercise Types ───────────────────────────────────────────────────────────

export interface ExerciseOption {
  value: string
  correct: boolean
}

export interface ExerciseSubQuestion {
  id: string
  text: string
  options: ExerciseOption[]
}

interface ExerciseBase {
  id: string
  number: number
  section?: string      // shown as a visual divider above the exercise card
  title: string
  instruction: string
  answerPanel?: string[] // lines shown in "Ver respuestas" panel
}

/** Text input exercises: fill in the blank */
export interface ExerciseFillBlank extends ExerciseBase {
  type: 'fill_blank'
  items: {
    id: string
    label: string       // e.g. "La letra H"
    answer: string      // exact correct answer (normalized for comparison)
    placeholder?: string
  }[]
}

/** Multiple choice: either a flat option list (1 question) or grouped sub-questions */
export interface ExerciseChoice extends ExerciseBase {
  type: 'choice'
  multiSelect: boolean  // true = select all that apply; false = select one per sub-question
  options?: ExerciseOption[]           // flat single-question
  questions?: ExerciseSubQuestion[]    // grouped sub-questions (each single-select)
}

/** Dialogue completion: fill blanks inside a conversation */
export interface ExerciseDialogue extends ExerciseBase {
  type: 'dialogue'
  wordBank?: string[]
  lines: {
    speaker: string
    text: string        // use ___id___ as blank placeholders, e.g. "___d1___ Alberto!"
  }[]
  answers: Record<string, string>  // { d1: "ciao", d2: "stai", ... }
}

/** Open-ended writing: no auto-check, just shows the structured result */
export interface ExerciseFreeWrite extends ExerciseBase {
  type: 'free_write'
  fields: {
    id: string
    prefix: string      // e.g. "Mi chiamo"
    placeholder: string
  }[]
}

export type Exercise = ExerciseFillBlank | ExerciseChoice | ExerciseDialogue | ExerciseFreeWrite

// ─── Multi-language Translation Types ─────────────────────────────────────────

export interface LessonTranslation {
  content_html: string
  grammar_notes: string
  vocabulary: VocabularyItem[]
}

/** Keys: 'en' | 'it' (Spanish is the default, stored in the base columns) */
export type LessonTranslations = Partial<Record<'en' | 'it', LessonTranslation>>

// ─── Lesson Row ───────────────────────────────────────────────────────────────

export interface LessonRow {
  id: string
  slug: string
  title: string
  level: LessonLevel
  order_index: number
  content_html: string
  vocabulary: VocabularyItem[]
  grammar_notes: string
  plan_required: PlanType
  status: LessonStatus
  intro_video_url: string | null
  video_subtitles: { es?: string; en?: string; it?: string }
  exercises: Exercise[]
  ui_language: LessonLanguage
  translations: LessonTranslations
  created_at: string
  updated_at: string
}

export interface LessonProgressRow {
  id: string
  user_id: string
  lesson_id: string
  score: number
  status: LessonProgressStatus
  attempts: number
  completed_at: string | null
  created_at: string
}

export interface TestQuestion {
  question: string
  options: string[]   // ['A) ...', 'B) ...', 'C) ...', 'D) ...']
  answer: string      // 'A' | 'B' | 'C' | 'D'
  explanation: string
}

// ─── Component Props Types ─────────────────────────────────────────────────
export interface NavItem {
  label: string
  href: string
  icon?: React.ReactNode
  badge?: string | number
  children?: NavItem[]
}

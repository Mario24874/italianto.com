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
      }
      usage_metrics: {
        Row: UsageMetricRow
        Insert: Omit<UsageMetricRow, 'id' | 'recorded_at'>
        Update: never
      }
      coupons: {
        Row: CouponRow
        Insert: Omit<CouponRow, 'id' | 'created_at' | 'times_used'>
        Update: Partial<Omit<CouponRow, 'id' | 'created_at'>>
      }
      app_sessions: {
        Row: AppSessionRow
        Insert: Omit<AppSessionRow, 'id'>
        Update: Partial<Omit<AppSessionRow, 'id'>>
      }
    }
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

// ─── Component Props Types ─────────────────────────────────────────────────
export interface NavItem {
  label: string
  href: string
  icon?: React.ReactNode
  badge?: string | number
  children?: NavItem[]
}

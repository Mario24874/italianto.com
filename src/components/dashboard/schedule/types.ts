export type StudyType = 'grammatica' | 'vocabolario' | 'ascolto' | 'parlare' | 'lettura' | 'scrittura' | 'tutor' | 'altro'

export interface StudySession {
  id: string
  user_id: string
  title: string
  type: StudyType
  day_of_week: number  // 1=Lun..7=Dom
  start_hour: number
  start_minute: number
  duration_min: number
  reminder_min: number | null
  reminder_last_sent: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export const TYPE_META: Record<StudyType, { label: string; emoji: string; color: string; bg: string; border: string; ring: string }> = {
  grammatica:  { label: 'Grammatica',  emoji: '📖', color: 'text-verde-300',  bg: 'bg-verde-900/60',   border: 'border-verde-700/50',  ring: 'ring-verde-600' },
  vocabolario: { label: 'Vocabolario', emoji: '📝', color: 'text-blue-300',   bg: 'bg-blue-900/60',    border: 'border-blue-700/50',   ring: 'ring-blue-600' },
  ascolto:     { label: 'Ascolto',     emoji: '🎧', color: 'text-purple-300', bg: 'bg-purple-900/60',  border: 'border-purple-700/50', ring: 'ring-purple-600' },
  parlare:     { label: 'Parlare',     emoji: '🗣️', color: 'text-orange-300', bg: 'bg-orange-900/60',  border: 'border-orange-700/50', ring: 'ring-orange-600' },
  lettura:     { label: 'Lettura',     emoji: '📚', color: 'text-teal-300',   bg: 'bg-teal-900/60',    border: 'border-teal-700/50',   ring: 'ring-teal-600' },
  scrittura:   { label: 'Scrittura',  emoji: '✍️', color: 'text-pink-300',   bg: 'bg-pink-900/60',    border: 'border-pink-700/50',   ring: 'ring-pink-600' },
  tutor:       { label: 'Tutor AI',   emoji: '🤖', color: 'text-amber-300',  bg: 'bg-amber-900/60',   border: 'border-amber-700/50',  ring: 'ring-amber-600' },
  altro:       { label: 'Altro',       emoji: '📅', color: 'text-slate-300',  bg: 'bg-slate-800/60',   border: 'border-slate-700/50',  ring: 'ring-slate-500' },
}

export const DAYS_IT = ['', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
export const DAYS_FULL_IT = ['', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']
export const HOURS = Array.from({ length: 16 }, (_, i) => i + 7)  // 7am to 10pm

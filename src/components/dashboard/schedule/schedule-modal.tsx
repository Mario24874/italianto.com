'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, BellOff, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StudySession, StudyType, TYPE_META, DAYS_IT, DAYS_FULL_IT } from './types'

interface ScheduleModalProps {
  open: boolean
  session?: StudySession | null
  defaultDay?: number
  defaultHour?: number
  defaultMinute?: number
  onSave: (data: Omit<StudySession, 'id' | 'user_id' | 'reminder_last_sent' | 'active' | 'created_at' | 'updated_at'>) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

const DURATION_OPTIONS = [
  { value: 30,  label: '30 min' },
  { value: 60,  label: '1 h' },
  { value: 90,  label: '1.5 h' },
  { value: 120, label: '2 h' },
]

const REMINDER_OPTIONS = [
  { value: 15,  label: '15 min' },
  { value: 30,  label: '30 min' },
  { value: 60,  label: '1 h' },
  { value: 120, label: '2 h' },
]

function buildTimeSlots() {
  const slots: { hour: number; minute: number; label: string }[] = []
  for (let h = 7; h <= 22; h++) {
    slots.push({ hour: h, minute: 0,  label: `${String(h).padStart(2,'0')}:00` })
    if (h < 22) slots.push({ hour: h, minute: 30, label: `${String(h).padStart(2,'0')}:30` })
  }
  return slots
}

const TIME_SLOTS = buildTimeSlots()

export function ScheduleModal({
  open,
  session,
  defaultDay = 1,
  defaultHour = 9,
  defaultMinute = 0,
  onSave,
  onDelete,
  onClose,
}: ScheduleModalProps) {
  const isEdit = !!session

  const [title, setTitle] = useState('')
  const [type, setType] = useState<StudyType>('altro')
  const [day, setDay] = useState(defaultDay)
  const [hour, setHour] = useState(defaultHour)
  const [minute, setMinute] = useState(defaultMinute)
  const [duration, setDuration] = useState(60)
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderMin, setReminderMin] = useState(15)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (open) {
      if (session) {
        setTitle(session.title)
        setType(session.type)
        setDay(session.day_of_week)
        setHour(session.start_hour)
        setMinute(session.start_minute)
        setDuration(session.duration_min)
        setReminderEnabled(session.reminder_min !== null)
        setReminderMin(session.reminder_min ?? 15)
      } else {
        setTitle('')
        setType('altro')
        setDay(defaultDay)
        setHour(defaultHour)
        setMinute(defaultMinute)
        setDuration(60)
        setReminderEnabled(false)
        setReminderMin(15)
      }
    }
  }, [open, session, defaultDay, defaultHour, defaultMinute])

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSave({
        title: title.trim(),
        type,
        day_of_week: day,
        start_hour: hour,
        start_minute: minute,
        duration_min: duration,
        reminder_min: reminderEnabled ? reminderMin : null,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!onDelete) return
    setDeleting(true)
    try {
      await onDelete()
    } finally {
      setDeleting(false)
    }
  }

  const selectedTimeLabel = TIME_SLOTS.find(s => s.hour === hour && s.minute === minute)?.label ?? `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-verde-800/50 bg-bg-dark-2 shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-verde-900/30">
              <div>
                <h2 className="text-lg font-bold text-verde-100">
                  {isEdit ? 'Modifica Sessione' : 'Nuova Sessione'}
                </h2>
                <p className="text-xs text-verde-600 mt-0.5">
                  {isEdit ? 'Aggiorna i dettagli della sessione' : 'Aggiungi una sessione ricorrente al tuo orario'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-verde-600 hover:text-verde-300 hover:bg-verde-900/40 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-verde-500 uppercase tracking-wider">Titolo</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="es. Grammatica avanzata..."
                  maxLength={80}
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-dark border border-verde-900/50 text-verde-100 placeholder-verde-800 text-sm focus:outline-none focus:border-verde-700 focus:ring-1 focus:ring-verde-700/50 transition-colors"
                />
              </div>

              {/* Type grid */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-verde-500 uppercase tracking-wider">Tipo</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.entries(TYPE_META) as [StudyType, typeof TYPE_META[StudyType]][]).map(([key, meta]) => (
                    <button
                      key={key}
                      onClick={() => setType(key)}
                      className={cn(
                        'flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-xs font-medium transition-all',
                        type === key
                          ? `${meta.bg} ${meta.border} ${meta.color} ring-1 ${meta.ring}/40`
                          : 'bg-bg-dark border-verde-900/30 text-verde-600 hover:border-verde-800/50 hover:text-verde-400'
                      )}
                    >
                      <span className="text-lg leading-none">{meta.emoji}</span>
                      <span className="leading-tight text-center">{meta.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Day */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-verde-500 uppercase tracking-wider">Giorno</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS_IT.slice(1).map((d, i) => {
                    const dow = i + 1
                    return (
                      <button
                        key={dow}
                        onClick={() => setDay(dow)}
                        title={DAYS_FULL_IT[dow]}
                        className={cn(
                          'py-2 rounded-xl text-xs font-semibold border transition-all',
                          day === dow
                            ? 'bg-verde-900/70 border-verde-700/60 text-verde-200'
                            : 'bg-bg-dark border-verde-900/30 text-verde-600 hover:border-verde-800/50 hover:text-verde-400'
                        )}
                      >
                        {d}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Time */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-verde-500 uppercase tracking-wider">Ora di inizio</label>
                <div className="relative">
                  <select
                    value={`${hour}:${minute}`}
                    onChange={e => {
                      const [h, m] = e.target.value.split(':').map(Number)
                      setHour(h)
                      setMinute(m)
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-dark border border-verde-900/50 text-verde-100 text-sm focus:outline-none focus:border-verde-700 focus:ring-1 focus:ring-verde-700/50 transition-colors appearance-none cursor-pointer"
                  >
                    {TIME_SLOTS.map(slot => (
                      <option key={`${slot.hour}:${slot.minute}`} value={`${slot.hour}:${slot.minute}`} className="bg-bg-dark-2">
                        {slot.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-verde-600 text-xs">
                    {selectedTimeLabel}
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-verde-500 uppercase tracking-wider">Durata</label>
                <div className="flex gap-2">
                  {DURATION_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setDuration(opt.value)}
                      className={cn(
                        'flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all',
                        duration === opt.value
                          ? 'bg-verde-900/70 border-verde-700/60 text-verde-200'
                          : 'bg-bg-dark border-verde-900/30 text-verde-600 hover:border-verde-800/50 hover:text-verde-400'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reminder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-verde-500 uppercase tracking-wider">Promemoria email</label>
                  <button
                    onClick={() => setReminderEnabled(r => !r)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all',
                      reminderEnabled
                        ? 'bg-verde-900/60 border-verde-700/50 text-verde-300'
                        : 'bg-bg-dark border-verde-900/30 text-verde-600 hover:border-verde-800/50'
                    )}
                  >
                    {reminderEnabled ? <Bell size={12} /> : <BellOff size={12} />}
                    {reminderEnabled ? 'Attivo' : 'Disattivo'}
                  </button>
                </div>
                <AnimatePresence>
                  {reminderEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-xs text-verde-700 mb-2">Ricevi un email prima della sessione:</p>
                      <div className="flex gap-2">
                        {REMINDER_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setReminderMin(opt.value)}
                            className={cn(
                              'flex-1 py-2 rounded-xl text-xs font-semibold border transition-all',
                              reminderMin === opt.value
                                ? 'bg-verde-900/70 border-verde-700/60 text-verde-200'
                                : 'bg-bg-dark border-verde-900/30 text-verde-600 hover:border-verde-800/50 hover:text-verde-400'
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-6 pb-6 pt-2">
              {isEdit && onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-900/50 text-red-400 hover:bg-red-900/20 hover:border-red-800/60 text-sm font-medium transition-all disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {deleting ? 'Eliminando...' : 'Elimina'}
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-verde-900/40 text-verde-500 hover:text-verde-300 hover:border-verde-800/60 text-sm font-medium transition-all"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim() || saving}
                className="px-5 py-2.5 rounded-xl bg-verde-800 hover:bg-verde-700 text-verde-100 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'Salvando...' : isEdit ? 'Aggiorna' : 'Salva'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Plus, Clock, BarChart2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import { StudySession, StudyType, TYPE_META } from './types'
import { WeeklyCalendar } from './weekly-calendar'
import { ScheduleModal } from './schedule-modal'

interface SchedulePageProps {
  initialSessions: StudySession[]
  userName: string
}

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create'; day: number; hour: number; minute: number }
  | { mode: 'edit'; session: StudySession }

export function SchedulePage({ initialSessions, userName }: SchedulePageProps) {
  const { t } = useLanguage()
  const sc = t.schedule
  const [sessions, setSessions] = useState<StudySession[]>(initialSessions)
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })

  function openCreate(day: number, hour: number, minute: number) {
    setModal({ mode: 'create', day, hour, minute })
  }

  function openEdit(session: StudySession) {
    setModal({ mode: 'edit', session })
  }

  function closeModal() {
    setModal({ mode: 'closed' })
  }

  async function handleSave(
    data: Omit<StudySession, 'id' | 'user_id' | 'reminder_last_sent' | 'active' | 'created_at' | 'updated_at'>
  ) {
    if (modal.mode === 'create') {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        toast.error(sc.toast.saveError)
        return
      }
      const created: StudySession = await res.json()
      setSessions(prev => [...prev, created].sort((a, b) =>
        a.day_of_week !== b.day_of_week ? a.day_of_week - b.day_of_week :
        a.start_hour !== b.start_hour ? a.start_hour - b.start_hour :
        a.start_minute - b.start_minute
      ))
      toast.success(sc.toast.added)
      closeModal()
    } else if (modal.mode === 'edit') {
      const res = await fetch(`/api/schedule/${modal.session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        toast.error(sc.toast.updateError)
        return
      }
      const updated: StudySession = await res.json()
      setSessions(prev => prev.map(s => s.id === updated.id ? updated : s).sort((a, b) =>
        a.day_of_week !== b.day_of_week ? a.day_of_week - b.day_of_week :
        a.start_hour !== b.start_hour ? a.start_hour - b.start_hour :
        a.start_minute - b.start_minute
      ))
      toast.success(sc.toast.updated)
      closeModal()
    }
  }

  async function handleDelete() {
    if (modal.mode !== 'edit') return
    const res = await fetch(`/api/schedule/${modal.session.id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error(sc.toast.deleteError)
      return
    }
    setSessions(prev => prev.filter(s => s.id !== modal.session.id))
    toast.success(sc.toast.deleted)
    closeModal()
  }

  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((acc, s) => acc + s.duration_min, 0)
  const totalHours = (totalMinutes / 60).toFixed(1)

  const typeCount = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] ?? 0) + 1
    return acc
  }, {})
  const maxCount = Math.max(1, ...Object.values(typeCount))

  return (
    <div className="flex flex-col h-full min-h-screen bg-bg-dark">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-verde-900/30"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-verde-900/50 border border-verde-800/40">
            <CalendarDays size={20} className="text-verde-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-verde-100">{sc.pageTitle}</h1>
            <p className="text-xs text-verde-600 mt-0.5">
              {userName ? sc.greeting.replace('{name}', userName) : ''}{sc.pageSubtitle}
            </p>
          </div>
        </div>
        <button
          onClick={() => openCreate(1, 9, 0)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-verde-800 hover:bg-verde-700 text-verde-100 text-sm font-semibold transition-all shadow-md hover:shadow-lg"
        >
          <Plus size={16} />
          {sc.newSession}
        </button>
      </motion.div>

      <div className="flex flex-col xl:flex-row flex-1 gap-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-1 min-h-0 overflow-hidden"
        >
          <WeeklyCalendar
            sessions={sessions}
            onSlotClick={openCreate}
            onSessionClick={openEdit}
          />
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="xl:w-64 shrink-0 border-t xl:border-t-0 xl:border-l border-verde-900/30 bg-bg-dark-2 p-5 space-y-5 overflow-y-auto"
        >
          <div>
            <p className="text-[10px] font-semibold text-verde-600 uppercase tracking-wider mb-3">{sc.summaryTitle}</p>
            <div className="grid grid-cols-2 xl:grid-cols-1 gap-3">
              <div className="bg-bg-dark rounded-xl border border-verde-900/30 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDays size={13} className="text-verde-600" />
                  <span className="text-[10px] text-verde-600 uppercase tracking-wide font-medium">{sc.sessionsLabel}</span>
                </div>
                <span className="text-2xl font-bold text-verde-200">{totalSessions}</span>
                <span className="text-xs text-verde-700 ml-1">{sc.perWeek}</span>
              </div>
              <div className="bg-bg-dark rounded-xl border border-verde-900/30 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={13} className="text-verde-600" />
                  <span className="text-[10px] text-verde-600 uppercase tracking-wide font-medium">{sc.totalHoursLabel}</span>
                </div>
                <span className="text-2xl font-bold text-verde-200">{totalHours}</span>
                <span className="text-xs text-verde-700 ml-1">{sc.hoursPerWeek}</span>
              </div>
            </div>
          </div>

          {totalSessions > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 size={13} className="text-verde-600" />
                <p className="text-[10px] font-semibold text-verde-600 uppercase tracking-wider">{sc.distributionLabel}</p>
              </div>
              <div className="space-y-2.5">
                {(Object.entries(typeCount) as [StudyType, number][])
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const meta = TYPE_META[type]
                    const pct = Math.round((count / maxCount) * 100)
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-1.5 text-xs text-verde-500">
                            <span>{meta.emoji}</span>
                            <span>{meta.label}</span>
                          </span>
                          <span className={cn('text-xs font-semibold', meta.color)}>{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-verde-950/60 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className={cn('h-full rounded-full', meta.bg.replace('/60', ''))}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {totalSessions === 0 && (
            <div className="text-center py-8">
              <div className="text-3xl mb-3">📅</div>
              <p className="text-xs text-verde-700 leading-relaxed whitespace-pre-line">
                {sc.noSessions}
              </p>
            </div>
          )}
        </motion.aside>
      </div>

      <ScheduleModal
        open={modal.mode !== 'closed'}
        session={modal.mode === 'edit' ? modal.session : null}
        defaultDay={modal.mode === 'create' ? modal.day : 1}
        defaultHour={modal.mode === 'create' ? modal.hour : 9}
        defaultMinute={modal.mode === 'create' ? modal.minute : 0}
        onSave={handleSave}
        onDelete={modal.mode === 'edit' ? handleDelete : undefined}
        onClose={closeModal}
      />
    </div>
  )
}

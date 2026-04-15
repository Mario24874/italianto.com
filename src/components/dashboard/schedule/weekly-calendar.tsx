'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { StudySession, TYPE_META, DAYS_IT, HOURS } from './types'

interface WeeklyCalendarProps {
  sessions: StudySession[]
  onSlotClick: (day: number, hour: number, minute: number) => void
  onSessionClick: (session: StudySession) => void
}

const SLOT_HEIGHT = 28  // px per 30-min slot
const START_HOUR = 7
const END_HOUR = 22

function getTopOffset(hour: number, minute: number) {
  const slotsFromTop = (hour - START_HOUR) * 2 + (minute === 30 ? 1 : 0)
  return slotsFromTop * SLOT_HEIGHT
}

function getSessionHeight(durationMin: number) {
  return (durationMin / 30) * SLOT_HEIGHT
}

export function WeeklyCalendar({ sessions, onSlotClick, onSessionClick }: WeeklyCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [hoveredSlot, setHoveredSlot] = useState<{ day: number; slotIndex: number } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const today = new Date()
  const jsDow = today.getDay()
  const todayDow = jsDow === 0 ? 7 : jsDow
  const currentHour = today.getHours()
  const currentMinute = today.getMinutes()

  // Build week dates for header (display purposes only — schedule is recurring)
  const weekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 6)
  const weekLabel = `${format(weekStart, 'd MMM', { locale: es })} – ${format(weekEnd, 'd MMM yyyy', { locale: es })}`

  const isCurrentWeek = weekOffset === 0

  // Current time indicator position
  const nowTop = getTopOffset(currentHour, currentMinute < 30 ? 0 : 30)
    + (currentMinute % 30) * (SLOT_HEIGHT / 30)

  // Total calendar height
  const totalSlots = (END_HOUR - START_HOUR) * 2 + 1  // including 22:00
  const totalHeight = totalSlots * SLOT_HEIGHT

  return (
    <div className="flex flex-col h-full">
      {/* Week navigation header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-verde-900/30">
        <button
          onClick={() => setWeekOffset(o => o - 1)}
          className="p-1.5 rounded-lg text-verde-600 hover:text-verde-300 hover:bg-verde-900/40 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-verde-300 capitalize">{weekLabel}</span>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-verde-600 hover:text-verde-400 transition-colors px-2 py-0.5 rounded-lg border border-verde-900/40 hover:border-verde-800/60"
            >
              Oggi
            </button>
          )}
        </div>
        <button
          onClick={() => setWeekOffset(o => o + 1)}
          className="p-1.5 rounded-lg text-verde-600 hover:text-verde-300 hover:bg-verde-900/40 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="flex border-b border-verde-900/30">
        {/* Time gutter */}
        <div className="w-14 shrink-0" />
        {/* Day columns */}
        {DAYS_IT.slice(1).map((d, i) => {
          const dow = i + 1
          const isToday = isCurrentWeek && dow === todayDow
          const colDate = addDays(weekStart, i)
          return (
            <div
              key={dow}
              className={cn(
                'flex-1 flex flex-col items-center py-2 text-center border-l border-verde-900/20',
                isToday && 'bg-verde-950/30'
              )}
            >
              <span className={cn('text-xs font-semibold', isToday ? 'text-verde-300' : 'text-verde-600')}>
                {d}
              </span>
              <span className={cn('text-xs mt-0.5', isToday ? 'text-verde-400 font-bold' : 'text-verde-700')}>
                {format(colDate, 'd')}
              </span>
              {isToday && (
                <span className="mt-1 text-[9px] font-bold text-verde-400 bg-verde-900/60 border border-verde-700/50 rounded-full px-1.5 py-0.5 leading-none">
                  OGGI
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex" style={{ height: totalHeight }}>
          {/* Time gutter */}
          <div className="w-14 shrink-0 relative">
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute right-2 text-[10px] text-verde-700 leading-none"
                style={{ top: getTopOffset(h, 0) - 6 }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS_IT.slice(1).map((_, i) => {
            const dow = i + 1
            const isToday = isCurrentWeek && dow === todayDow
            const daySessions = sessions.filter(s => s.day_of_week === dow)

            return (
              <div
                key={dow}
                className={cn(
                  'flex-1 relative border-l border-verde-900/20',
                  isToday && 'bg-verde-950/20'
                )}
                style={{ height: totalHeight }}
              >
                {/* Hour grid lines */}
                {HOURS.map(h => (
                  <div key={h}>
                    <div
                      className="absolute left-0 right-0 border-t border-verde-900/20"
                      style={{ top: getTopOffset(h, 0) }}
                    />
                    <div
                      className="absolute left-0 right-0 border-t border-verde-900/10 border-dashed"
                      style={{ top: getTopOffset(h, 30) }}
                    />
                  </div>
                ))}

                {/* Clickable slots */}
                {Array.from({ length: totalSlots }, (_, slotIdx) => {
                  const slotHour = START_HOUR + Math.floor(slotIdx / 2)
                  const slotMin = (slotIdx % 2) * 30
                  const isHovered = hoveredSlot?.day === dow && hoveredSlot?.slotIndex === slotIdx
                  return (
                    <div
                      key={slotIdx}
                      className={cn(
                        'absolute left-0 right-0 cursor-pointer transition-colors group',
                        isHovered && 'bg-verde-900/20'
                      )}
                      style={{ top: slotIdx * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                      onMouseEnter={() => setHoveredSlot({ day: dow, slotIndex: slotIdx })}
                      onMouseLeave={() => setHoveredSlot(null)}
                      onClick={() => onSlotClick(dow, slotHour, slotMin)}
                    >
                      {isHovered && (
                        <div className="absolute inset-x-1 inset-y-0.5 rounded flex items-center justify-center">
                          <span className="text-[10px] text-verde-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            + {String(slotHour).padStart(2,'0')}:{String(slotMin).padStart(2,'0')}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Session cards */}
                {daySessions.map((session, idx) => {
                  const top = getTopOffset(session.start_hour, session.start_minute)
                  const height = getSessionHeight(session.duration_min)
                  const meta = TYPE_META[session.type]

                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, delay: idx * 0.04 }}
                      className={cn(
                        'absolute left-1 right-1 rounded-lg border px-1.5 py-1 cursor-pointer overflow-hidden z-10',
                        'hover:brightness-110 hover:shadow-lg transition-all',
                        meta.bg, meta.border
                      )}
                      style={{ top: top + 2, height: height - 4 }}
                      onClick={e => { e.stopPropagation(); onSessionClick(session) }}
                    >
                      <div className={cn('text-[10px] font-bold leading-tight truncate', meta.color)}>
                        {meta.emoji} {session.title}
                      </div>
                      {height > 36 && (
                        <div className="text-[9px] text-verde-700 leading-tight mt-0.5">
                          {String(session.start_hour).padStart(2,'0')}:{String(session.start_minute).padStart(2,'0')}
                          {' '}·{' '}
                          {session.duration_min >= 60
                            ? `${session.duration_min / 60}h`
                            : `${session.duration_min}m`}
                        </div>
                      )}
                    </motion.div>
                  )
                })}

                {/* Current time indicator */}
                {isToday && currentHour >= START_HOUR && currentHour <= END_HOUR && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: nowTop }}
                  >
                    <div className="relative flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 -ml-0.5" />
                      <div className="flex-1 h-px bg-red-500/70" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

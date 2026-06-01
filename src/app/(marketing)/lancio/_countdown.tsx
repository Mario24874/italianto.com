'use client'

import { useEffect, useState } from 'react'

const LAUNCH_END = new Date('2026-06-09T23:59:59Z')

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(): TimeLeft {
  const diff = LAUNCH_END.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds }
}

export function CountdownTimer() {
  const [mounted, setMounted] = useState(false)
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    setMounted(true)
    setTimeLeft(getTimeLeft())
    const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null

  const units = [
    { value: timeLeft.days, label: 'días' },
    { value: timeLeft.hours, label: 'horas' },
    { value: timeLeft.minutes, label: 'min' },
    { value: timeLeft.seconds, label: 'seg' },
  ]

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {units.map(({ value, label }, i) => (
        <div key={label} className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="min-w-[68px] h-[68px] flex items-center justify-center rounded-xl bg-verde-950/80 border border-verde-700/60 shadow-inner">
              <span className="text-3xl font-extrabold text-verde-100 tabular-nums leading-none">
                {String(value).padStart(2, '0')}
              </span>
            </div>
            <span className="text-[10px] text-verde-500 mt-1 uppercase tracking-widest font-medium">
              {label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span className="text-verde-600 text-2xl font-bold mb-5 select-none">:</span>
          )}
        </div>
      ))}
    </div>
  )
}

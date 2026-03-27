import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  subtitle?: string
  trend?: {
    value: number
    label: string
  }
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  className?: string
}

export function StatsCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  iconColor = 'text-verde-400',
  iconBg = 'bg-verde-950/60 border-verde-800/40',
  className,
}: StatsCardProps) {
  const isPositive = trend && trend.value > 0
  const isNegative = trend && trend.value < 0

  return (
    <div
      className={cn(
        'rounded-2xl border border-verde-900/40 bg-bg-dark-2/70 p-5 transition-all duration-200 hover:border-verde-800/60',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs font-medium text-verde-500 uppercase tracking-wider mb-0.5">
            {title}
          </div>
        </div>
        <div className={cn('size-10 rounded-xl border flex items-center justify-center shrink-0', iconBg)}>
          <Icon size={18} className={iconColor} />
        </div>
      </div>

      <div className="text-3xl font-extrabold text-verde-50 tracking-tight mb-1">
        {value}
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-2">
          {trend && (
            <div
              className={cn(
                'flex items-center gap-0.5 text-xs font-semibold',
                isPositive && 'text-verde-400',
                isNegative && 'text-red-400',
                !isPositive && !isNegative && 'text-verde-600'
              )}
            >
              {isPositive && <TrendingUp size={12} />}
              {isNegative && <TrendingDown size={12} />}
              {!isPositive && !isNegative && <Minus size={12} />}
              {Math.abs(trend.value)}%
            </div>
          )}
          <div className="text-xs text-verde-600">
            {trend?.label || subtitle}
          </div>
        </div>
      )}
    </div>
  )
}

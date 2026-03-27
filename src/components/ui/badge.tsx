import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-verde-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-verde-700/50 bg-verde-950/80 text-verde-400',
        brand: 'border-brand/40 bg-brand/10 text-verde-300',
        outline: 'border-current bg-transparent text-current',
        success: 'border-green-700/50 bg-green-950/60 text-green-400',
        warning: 'border-yellow-700/50 bg-yellow-950/60 text-yellow-400',
        error: 'border-red-700/50 bg-red-950/60 text-red-400',
        info: 'border-blue-700/50 bg-blue-950/60 text-blue-400',
        premium:
          'border-amber-500/40 bg-gradient-to-r from-amber-950/60 to-yellow-950/60 text-amber-400',
        glass: 'glass border-white/10 text-white/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
  pulse?: boolean
}

function Badge({ className, variant, dot, pulse, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          )}
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }

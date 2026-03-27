import * as React from 'react'
import { cn } from '@/lib/utils'

// ─── Base Card ─────────────────────────────────────────────────────────────
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { hoverable?: boolean }
>(({ className, hoverable, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-2xl border border-verde-200/50 dark:border-verde-900/50 bg-bg-light-2/80 dark:bg-bg-dark-2/80',
      hoverable &&
        'transition-all duration-300 hover:border-verde-700/60 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer',
      className
    )}
    {...props}
  />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-verde-50', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-verde-400', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

// ─── Spotlight Card (SeraUI inspired) ─────────────────────────────────────
const SpotlightCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, onMouseMove, ...props }, ref) => {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    e.currentTarget.style.setProperty('--mouse-x', `${x}%`)
    e.currentTarget.style.setProperty('--mouse-y', `${y}%`)
    onMouseMove?.(e)
  }

  return (
    <div
      ref={ref}
      className={cn('spotlight-card rounded-2xl border border-verde-200/50 dark:border-verde-900/50 bg-bg-light-2/80 dark:bg-bg-dark-2/80', className)}
      onMouseMove={handleMouseMove}
      {...props}
    />
  )
})
SpotlightCard.displayName = 'SpotlightCard'

// ─── Glass Card ─────────────────────────────────────────────────────────────
const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('glass-dark rounded-2xl', className)}
    {...props}
  />
))
GlassCard.displayName = 'GlassCard'

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  SpotlightCard,
  GlassCard,
}

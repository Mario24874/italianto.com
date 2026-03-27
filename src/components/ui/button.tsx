'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-transparent transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verde-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-brand text-white hover:bg-brand-light active:scale-[0.98] shadow-brand hover:shadow-brand-lg shimmer-btn',
        outline:
          'border border-verde-700 text-verde-400 bg-transparent hover:bg-verde-950 hover:border-verde-500 active:scale-[0.98]',
        ghost:
          'text-verde-400 hover:bg-verde-950/60 hover:text-verde-300 active:scale-[0.98]',
        secondary:
          'bg-verde-950 text-verde-300 border border-verde-900 hover:bg-verde-900 hover:border-verde-700 active:scale-[0.98]',
        destructive:
          'bg-red-900/20 text-red-400 border border-red-800 hover:bg-red-900/40 active:scale-[0.98]',
        link: 'text-verde-400 underline-offset-4 hover:underline p-0 h-auto',
        glass:
          'glass text-verde-300 hover:bg-white/10 active:scale-[0.98] border-verde-800/50',
        gradient:
          'bg-gradient-to-r from-brand to-verde-600 text-white hover:from-verde-600 hover:to-brand active:scale-[0.98] shadow-brand',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        xl: 'h-14 rounded-2xl px-10 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {asChild ? children : (
          <>
            {loading && (
              <svg
                className="animate-spin size-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {children}
          </>
        )}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }

'use client'

import { UserButton } from '@clerk/nextjs'

interface ClerkUserButtonProps {
  size?: 'sm' | 'md'
  afterSignOutUrl?: string
}

export function ClerkUserButton({ size = 'md', afterSignOutUrl = '/' }: ClerkUserButtonProps) {
  const boxSize = size === 'sm' ? 'size-7' : 'size-8'

  return (
    <UserButton
      afterSignOutUrl={afterSignOutUrl}
      appearance={{
        variables: {
          colorBackground: '#0d1a0e',
          colorText: '#e8f5e9',
          colorTextSecondary: '#6abf69',
          colorPrimary: '#2e7d32',
          colorInputBackground: '#111f12',
          colorInputText: '#e8f5e9',
          colorNeutral: '#4caf50',
          borderRadius: '0.75rem',
          fontSize: '14px',
        },
        elements: {
          avatarBox: `${boxSize} ring-1 ring-verde-800`,
          userButtonPopoverCard: 'shadow-2xl border border-verde-900/60',
          userButtonPopoverActionButton: 'hover:bg-verde-950/60',
          userButtonPopoverActionButtonText: 'text-verde-200',
          userButtonPopoverActionButtonIcon: 'text-verde-400',
          userButtonPopoverFooter: 'border-t border-verde-900/40',
          userPreviewMainIdentifier: 'text-verde-100 font-semibold',
          userPreviewSecondaryIdentifier: 'text-verde-500',
          userPreviewAvatarBox: 'ring-1 ring-verde-700',
        },
      }}
    />
  )
}

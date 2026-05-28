'use client'

import { useEffect } from 'react'
import { useTutorSession } from '@/contexts/tutor-session-context'
import type { ActiveTutorData } from '@/contexts/tutor-session-context'

export function TutorSessionActivator({ tutorData }: { tutorData: ActiveTutorData }) {
  const { activateSession, activeTutor } = useTutorSession()

  useEffect(() => {
    // Only activate if switching to a different tutor or no active session
    if (!activeTutor || activeTutor.slug !== tutorData.slug) {
      activateSession(tutorData)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorData.slug])

  return null
}

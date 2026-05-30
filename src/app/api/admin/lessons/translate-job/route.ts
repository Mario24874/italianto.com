/**
 * Async translate job store — same pattern as import-job.
 * Safe for single-replica deployments (one container = one Node process).
 * Jobs are cleaned up after 10 minutes to avoid memory leaks.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import type { LessonTranslation } from '@/types'

export const dynamic = 'force-dynamic'

type JobStatus = 'pending' | 'done' | 'error'

interface TranslateJob {
  status: JobStatus
  translation?: LessonTranslation
  lang?: string
  error?: string
  createdAt: number
}

const jobs = new Map<string, TranslateJob>()

function pruneOldJobs() {
  const cutoff = Date.now() - 10 * 60 * 1000
  for (const [id, job] of jobs) {
    if (job.createdAt < cutoff) jobs.delete(id)
  }
}

export function createTranslateJob(): string {
  pruneOldJobs()
  const id = `tr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  jobs.set(id, { status: 'pending', createdAt: Date.now() })
  return id
}

export function resolveTranslateJob(id: string, translation: LessonTranslation, lang: string) {
  const job = jobs.get(id)
  if (job) jobs.set(id, { ...job, status: 'done', translation, lang })
}

export function rejectTranslateJob(id: string, error: string) {
  const job = jobs.get(id)
  if (job) jobs.set(id, { ...job, status: 'error', error })
}

/** GET /api/admin/lessons/translate-job?id=xxx — poll job status */
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const job = jobs.get(id)
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  return NextResponse.json({
    status: job.status,
    ...(job.translation && { translation: job.translation }),
    ...(job.lang && { lang: job.lang }),
    ...(job.error && { error: job.error }),
  })
}

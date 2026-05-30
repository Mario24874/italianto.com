/**
 * Async import job store using a module-level Map.
 * Safe for single-replica deployments (one container = one Node process).
 * Jobs are cleaned up after 10 minutes to avoid memory leaks.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

type JobStatus = 'pending' | 'done' | 'error'

interface ImportJob {
  status: JobStatus
  lesson?: Record<string, unknown>
  error?: string
  createdAt: number
}

// Module-level store — survives across requests in the same process
const jobs = new Map<string, ImportJob>()

// Clean up jobs older than 10 minutes
function pruneOldJobs() {
  const cutoff = Date.now() - 10 * 60 * 1000
  for (const [id, job] of jobs) {
    if (job.createdAt < cutoff) jobs.delete(id)
  }
}

/** Create a new pending job and return its ID */
export function createJob(): string {
  pruneOldJobs()
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  jobs.set(id, { status: 'pending', createdAt: Date.now() })
  return id
}

/** Mark job as done with result */
export function resolveJob(id: string, lesson: Record<string, unknown>) {
  const job = jobs.get(id)
  if (job) jobs.set(id, { ...job, status: 'done', lesson })
}

/** Mark job as failed */
export function rejectJob(id: string, error: string) {
  const job = jobs.get(id)
  if (job) jobs.set(id, { ...job, status: 'error', error })
}

/** GET /api/admin/lessons/import-job?id=xxx — poll job status */
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
    ...(job.lesson && { lesson: job.lesson }),
    ...(job.error && { error: job.error }),
  })
}

import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { CuponesClient } from './_cupones-client'

export const metadata: Metadata = { title: 'Cupones — Admin' }

export default async function AdminCuponesPage() {
  await requireAdmin()
  return <CuponesClient />
}

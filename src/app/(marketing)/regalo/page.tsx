import { RegaloClient } from './_regalo-client'

export default async function RegaloPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>
}) {
  const sp = await searchParams
  const initialStatus = sp.success ? 'success' : sp.canceled ? 'canceled' : null
  return <RegaloClient initialStatus={initialStatus} />
}

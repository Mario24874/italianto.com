'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { generateCouponCode, formatDate } from '@/lib/utils'
import { Tag, Plus, Copy, Check, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import type { CouponRow, PlanType } from '@/types'

function CreateCouponModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (coupon: CouponRow) => void
}) {
  const [form, setForm] = useState({
    code: generateCouponCode(),
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 20,
    duration: 'once' as 'once' | 'forever' | 'repeating',
    max_uses: '',
    expires_at: '',
    applicable_plans: ['essenziale', 'avanzato', 'maestro'] as PlanType[],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          max_uses: form.max_uses ? Number(form.max_uses) : null,
          expires_at: form.expires_at || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear cupón')
      onCreate(data.coupon)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md glass-dark rounded-2xl p-6 border border-verde-800/40">
        <h3 className="text-lg font-bold text-verde-100 mb-5">Crear cupón de descuento</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-verde-400 mb-1.5">Código</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="flex-1 px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-sm text-verde-200 focus:outline-none focus:border-verde-600 font-mono"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setForm(f => ({ ...f, code: generateCouponCode() }))}
                title="Generar código"
              >
                <Tag size={14} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-verde-400 mb-1.5">Tipo</label>
              <select
                value={form.discount_type}
                onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as 'percentage' | 'fixed' }))}
                className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-sm text-verde-200 focus:outline-none focus:border-verde-600"
              >
                <option value="percentage">Porcentaje %</option>
                <option value="fixed">Fijo USD</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-verde-400 mb-1.5">Valor</label>
              <input
                type="number"
                value={form.discount_value}
                onChange={e => setForm(f => ({ ...f, discount_value: Number(e.target.value) }))}
                min={1}
                max={form.discount_type === 'percentage' ? 100 : undefined}
                className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-sm text-verde-200 focus:outline-none focus:border-verde-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-verde-400 mb-1.5">Duración</label>
            <select
              value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: e.target.value as 'once' | 'forever' | 'repeating' }))}
              className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-sm text-verde-200 focus:outline-none focus:border-verde-600"
            >
              <option value="once">Una vez (primer pago)</option>
              <option value="forever">Siempre (todos los pagos)</option>
              <option value="repeating">Meses fijos</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-verde-400 mb-1.5">Máx. usos</label>
              <input
                type="number"
                value={form.max_uses}
                onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                placeholder="Sin límite"
                className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-sm text-verde-200 placeholder:text-verde-600 focus:outline-none focus:border-verde-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-verde-400 mb-1.5">Vence</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-verde-950/50 border border-verde-800/40 text-sm text-verde-200 focus:outline-none focus:border-verde-600"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Creando...</> : 'Crear cupón'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminCuponesPage() {
  const [coupons, setCoupons] = useState<CouponRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/coupons')
      .then(r => r.json())
      .then(data => {
        if (data.error) console.error('Coupons API error:', data.error)
        setCoupons(data.coupons || [])
      })
      .catch(err => console.error('Coupons fetch failed:', err))
      .finally(() => setLoading(false))
  }, [])

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleActive = async (id: string, currentActive: boolean) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentActive } : c))
    try {
      await fetch(`/api/admin/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      })
    } catch {
      // revert on error
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: currentActive } : c))
    }
  }

  const deleteCoupon = async (id: string) => {
    setCoupons(prev => prev.filter(c => c.id !== id))
    try {
      await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
    } catch {
      // ignore — UI already removed it
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {showModal && (
        <CreateCouponModal
          onClose={() => setShowModal(false)}
          onCreate={c => setCoupons(prev => [c, ...prev])}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-verde-50 flex items-center gap-2.5">
            <Tag size={24} className="text-verde-400" />
            Cupones de descuento
          </h1>
          <p className="text-sm text-verde-500 mt-0.5">
            {loading ? 'Cargando...' : `${coupons.length} cupones en Stripe`}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={15} />
          Nuevo cupón
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-verde-600" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20 text-verde-600 text-sm">
          No hay cupones creados todavía.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {coupons.map(coupon => (
            <div
              key={coupon.id}
              className={`rounded-2xl border p-5 transition-all ${
                coupon.is_active
                  ? 'border-verde-800/40 bg-verde-950/30'
                  : 'border-verde-900/30 bg-bg-dark-2/40 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-mono text-lg font-bold text-verde-100 tracking-wider">
                    {coupon.code}
                  </div>
                  <div className="text-xs text-verde-500 mt-0.5">
                    {coupon.discount_value}
                    {coupon.discount_type === 'percentage' ? '%' : ' USD'} de descuento
                  </div>
                </div>
                <Badge variant={coupon.is_active ? 'success' : 'default'} dot>
                  {coupon.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs text-verde-500 mb-4">
                <div className="flex justify-between">
                  <span>Usos</span>
                  <span className="text-verde-300">
                    {coupon.times_used} / {coupon.max_uses ?? '∞'}
                  </span>
                </div>
                <div className="w-full bg-verde-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-verde-600 h-full rounded-full transition-all"
                    style={{
                      width: coupon.max_uses
                        ? `${Math.min((coupon.times_used / coupon.max_uses) * 100, 100)}%`
                        : '0%',
                    }}
                  />
                </div>
                {coupon.expires_at && (
                  <div className="flex justify-between">
                    <span>Vence</span>
                    <span className="text-verde-300">
                      {formatDate(coupon.expires_at, 'es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => copyCode(coupon.id, coupon.code)}
                >
                  {copiedId === coupon.id ? (
                    <><Check size={12} /> Copiado</>
                  ) : (
                    <><Copy size={12} /> Copiar</>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => toggleActive(coupon.id, coupon.is_active)}
                  title={coupon.is_active ? 'Desactivar' : 'Activar'}
                >
                  {coupon.is_active ? (
                    <ToggleRight size={15} className="text-verde-400" />
                  ) : (
                    <ToggleLeft size={15} className="text-verde-600" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteCoupon(coupon.id)}
                  title="Eliminar"
                >
                  <Trash2 size={13} className="text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { generateCouponCode, formatDate } from '@/lib/utils'
import { Tag, Plus, Copy, Check, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import type { CouponRow, PlanType } from '@/types'

// Mock data - reemplazar con fetch real
const MOCK_COUPONS: CouponRow[] = [
  {
    id: '1',
    code: 'BIENVENIDO20',
    discount_type: 'percentage',
    discount_value: 20,
    currency: null,
    applicable_plans: ['essenziale', 'avanzato'],
    max_uses: 100,
    times_used: 34,
    expires_at: '2025-06-01',
    is_active: true,
    created_by: 'admin',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    code: 'MAESTRO30',
    discount_type: 'percentage',
    discount_value: 30,
    currency: null,
    applicable_plans: ['maestro'],
    max_uses: 50,
    times_used: 12,
    expires_at: '2025-12-31',
    is_active: true,
    created_by: 'admin',
    created_at: new Date().toISOString(),
  },
]

function CreateCouponModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (coupon: Partial<CouponRow>) => void
}) {
  const [form, setForm] = useState({
    code: generateCouponCode(),
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 20,
    max_uses: '',
    expires_at: '',
    applicable_plans: ['essenziale', 'avanzato', 'maestro'] as PlanType[],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({ ...form, is_active: true })
    onClose()
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
                <option value="fixed">Fijo $</option>
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

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Crear cupón
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminCuponesPage() {
  const [coupons, setCoupons] = useState<CouponRow[]>(MOCK_COUPONS)
  const [showModal, setShowModal] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleActive = (id: string) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c))
  }

  const deleteCoupon = (id: string) => {
    setCoupons(prev => prev.filter(c => c.id !== id))
  }

  const handleCreate = (newCoupon: Partial<CouponRow>) => {
    const coupon: CouponRow = {
      id: Date.now().toString(),
      code: newCoupon.code || '',
      discount_type: newCoupon.discount_type || 'percentage',
      discount_value: newCoupon.discount_value || 0,
      currency: null,
      applicable_plans: newCoupon.applicable_plans || [],
      max_uses: newCoupon.max_uses || null,
      times_used: 0,
      expires_at: newCoupon.expires_at || null,
      is_active: true,
      created_by: 'admin',
      created_at: new Date().toISOString(),
    }
    setCoupons(prev => [coupon, ...prev])
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {showModal && (
        <CreateCouponModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-verde-50 flex items-center gap-2.5">
            <Tag size={24} className="text-verde-400" />
            Cupones de descuento
          </h1>
          <p className="text-sm text-verde-500 mt-0.5">{coupons.length} cupones creados</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={15} />
          Nuevo cupón
        </Button>
      </div>

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
                  {coupon.times_used} / {coupon.max_uses || '∞'}
                </span>
              </div>
              <div className="w-full bg-verde-950 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-verde-600 h-full rounded-full transition-all"
                  style={{
                    width: coupon.max_uses
                      ? `${(coupon.times_used / coupon.max_uses) * 100}%`
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
                onClick={() => toggleActive(coupon.id)}
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
    </div>
  )
}

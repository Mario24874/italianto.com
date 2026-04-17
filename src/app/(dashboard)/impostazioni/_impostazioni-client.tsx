'use client'

import { useState, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { Settings, User, CreditCard, MessageSquare, Camera, Save, Zap, Star, Crown } from 'lucide-react'
import type { PlanType } from '@/lib/plans'
import { useLanguage } from '@/contexts/language-context'

const PLAN_ICONS: Record<string, React.ElementType> = { essenziale: Star, avanzato: Zap, maestro: Crown }
const TYPE_LABELS: Record<string, string> = { contact: 'Contacto', comment: 'Comentario', bug_report: 'Reporte', feature_request: 'Sugerencia' }
const STATUS_COLORS: Record<string, string> = {
  unread:   'bg-blue-900/40 text-blue-300 border-blue-700/30',
  read:     'bg-verde-900/40 text-verde-400 border-verde-700/30',
  replied:  'bg-purple-900/40 text-purple-300 border-purple-700/30',
  resolved: 'bg-gray-900/40 text-gray-400 border-gray-700/30',
}

interface Message { id: string; message: string; type: string; status: string; created_at: string }

interface Props {
  userId: string
  firstName: string
  lastName: string
  email: string
  imageUrl: string
  planType: PlanType
  planName: string | null
  billingInterval: string | null
  periodEnd: string | null
  cancelAtPeriodEnd: boolean
  myMessages: Message[]
}

export function ImpostazioniClient({ firstName, lastName, email, imageUrl, planType, planName, billingInterval, periodEnd, cancelAtPeriodEnd, myMessages }: Props) {
  const { user } = useUser()
  const { lang, setLang } = useLanguage()
  const [editFirst, setEditFirst] = useState(firstName)
  const [editLast, setEditLast] = useState(lastName)
  const [savingName, setSavingName] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [activeTab, setActiveTab] = useState<'perfil' | 'plan' | 'mensajes'>('perfil')
  const fileRef = useRef<HTMLInputElement>(null)

  const PlanIcon = PLAN_ICONS[planType] ?? Zap

  async function saveName() {
    if (!user) return
    setSavingName(true)
    try {
      await user.update({ firstName: editFirst, lastName: editLast })
      toast.success('Nombre actualizado')
    } catch {
      toast.error('Error al actualizar el nombre')
    } finally {
      setSavingName(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    try {
      await user.setProfileImage({ file })
      toast.success('Avatar actualizado')
    } catch {
      toast.error('Error al subir el avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const tabs = [
    { id: 'perfil' as const, label: 'Perfil', icon: User },
    { id: 'plan' as const, label: 'Mi Plan', icon: CreditCard },
    { id: 'mensajes' as const, label: 'Mis Mensajes', icon: MessageSquare },
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-verde-50 flex items-center gap-3">
          <Settings size={28} className="text-verde-400" />
          Impostazioni
        </h1>
        <p className="text-verde-500 mt-1 text-sm">Gestiona tu perfil y preferencias</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-verde-950/40 border border-verde-900/30">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === id ? 'bg-verde-900/60 text-verde-200 border border-verde-800/40' : 'text-verde-500 hover:text-verde-300'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Perfil Tab */}
      {activeTab === 'perfil' && (
        <div className="space-y-4">
          {/* Avatar */}
          <div className="p-6 rounded-2xl border border-verde-900/30 bg-verde-950/20 space-y-4">
            <h2 className="text-sm font-semibold text-verde-300 uppercase tracking-wide">Foto de perfil</h2>
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-verde-700/50 bg-verde-900">
                  {imageUrl ? (
                    <Image src={imageUrl} alt="Avatar" width={80} height={80} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-verde-400">
                      {(firstName || email)[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-verde-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-verde-900/40 border border-verde-800/40 text-verde-300 hover:bg-verde-900/60 transition-colors text-sm disabled:opacity-50"
                >
                  <Camera size={14} />
                  {uploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}
                </button>
                <p className="text-xs text-verde-600 mt-1.5">JPG, PNG o GIF. Máx 10MB</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
          </div>

          {/* Name */}
          <div className="p-6 rounded-2xl border border-verde-900/30 bg-verde-950/20 space-y-4">
            <h2 className="text-sm font-semibold text-verde-300 uppercase tracking-wide">Información personal</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-verde-500 mb-1.5">Nombre</label>
                <input
                  value={editFirst}
                  onChange={e => setEditFirst(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none focus:border-verde-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-verde-500 mb-1.5">Apellido</label>
                <input
                  value={editLast}
                  onChange={e => setEditLast(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-verde-950/50 border border-verde-800/40 text-verde-200 text-sm focus:outline-none focus:border-verde-600 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-verde-500 mb-1.5">Email</label>
              <input value={email} disabled className="w-full px-3 py-2.5 rounded-xl bg-verde-950/30 border border-verde-900/30 text-verde-500 text-sm cursor-not-allowed" />
              <p className="text-xs text-verde-700 mt-1">El email se gestiona desde tu cuenta Clerk</p>
            </div>
            <button
              onClick={saveName}
              disabled={savingName}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-verde-700 hover:bg-verde-600 text-white font-semibold text-sm transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              {savingName ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>

          {/* Language */}
          <div className="p-6 rounded-2xl border border-verde-900/30 bg-verde-950/20 space-y-3">
            <h2 className="text-sm font-semibold text-verde-300 uppercase tracking-wide">Idioma de la interfaz</h2>
            <div className="flex gap-2">
              {[
                { code: 'es', flag: '🇪🇸', label: 'Español' },
                { code: 'en', flag: '🇺🇸', label: 'English' },
                { code: 'it', flag: '🇮🇹', label: 'Italiano' },
              ].map(l => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code as 'es' | 'en' | 'it')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    lang === l.code
                      ? 'bg-verde-900/60 text-verde-200 border-verde-700/50'
                      : 'bg-verde-950/30 text-verde-500 border-verde-900/30 hover:text-verde-300 hover:border-verde-800/40'
                  }`}
                >
                  <span>{l.flag}</span> {l.label}
                  {lang === l.code && <span className="text-verde-400">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Plan Tab */}
      {activeTab === 'plan' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl border border-verde-700/40 bg-gradient-to-r from-verde-950/60 to-verde-950/20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-verde-900/60 border border-verde-700/40 flex items-center justify-center">
                <PlanIcon size={18} className="text-verde-400" />
              </div>
              <div>
                <div className="font-bold text-verde-100 text-lg">Plan {planName ?? planType}</div>
                <div className="text-sm text-verde-400 capitalize">
                  {billingInterval === 'year' ? 'Facturación anual' : billingInterval === 'month' ? 'Facturación mensual' : 'Plan gratuito'}
                  {cancelAtPeriodEnd && ' · Cancela al final del período'}
                </div>
              </div>
            </div>
            {periodEnd && (
              <div className="text-xs text-verde-500 bg-verde-950/30 border border-verde-900/30 px-3 py-2 rounded-lg">
                {cancelAtPeriodEnd ? 'Acceso hasta:' : 'Próxima renovación:'}{' '}
                <span className="text-verde-300 font-medium">
                  {new Date(periodEnd).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}
            <Link href="/precios" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-verde-700 hover:bg-verde-600 text-white font-semibold text-sm transition-colors">
              {planType === 'free' ? 'Ver planes' : 'Cambiar plan'}
            </Link>
          </div>
        </div>
      )}

      {/* Mensajes Tab */}
      {activeTab === 'mensajes' && (
        <div className="space-y-3">
          {myMessages.length === 0 ? (
            <div className="text-center py-12 text-verde-600">
              <MessageSquare size={36} className="mx-auto mb-3 text-verde-800" />
              <p>No has enviado mensajes todavía.</p>
            </div>
          ) : (
            myMessages.map((msg: Message) => (
              <div key={msg.id} className="p-4 rounded-2xl border border-verde-900/30 bg-verde-950/20 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-medium text-verde-400 bg-verde-950/40 border border-verde-800/30 px-2 py-0.5 rounded">
                    {TYPE_LABELS[msg.type] ?? msg.type}
                  </span>
                  <span className={`text-[10px] font-bold border px-2 py-0.5 rounded ${STATUS_COLORS[msg.status] ?? ''}`}>
                    {msg.status}
                  </span>
                  <span className="text-xs text-verde-600 ml-auto">
                    {new Date(msg.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <p className="text-sm text-verde-300 line-clamp-3">{msg.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

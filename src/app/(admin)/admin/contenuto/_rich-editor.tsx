'use client'

import { useRef, useEffect, useCallback } from 'react'
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Quote, Minus, Undo2, Redo2, Link2, ImagePlus, Loader2, Palette, X,
} from 'lucide-react'
import { useState } from 'react'

interface RichEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

const COLOR_PALETTE = [
  { cls: 'lc-blue',   label: 'Azul',    light: '#1d4ed8', dark: '#93c5fd' },
  { cls: 'lc-green',  label: 'Verde',   light: '#15803d', dark: '#86efac' },
  { cls: 'lc-red',    label: 'Rojo',    light: '#b91c1c', dark: '#fca5a5' },
  { cls: 'lc-purple', label: 'Violeta', light: '#7c3aed', dark: '#c4b5fd' },
  { cls: 'lc-teal',   label: 'Teal',    light: '#0f766e', dark: '#5eead4' },
  { cls: 'lc-orange', label: 'Naranja', light: '#c2410c', dark: '#fdba74' },
  { cls: 'lc-amber',  label: 'Ámbar',   light: '#92400e', dark: '#fcd34d' },
  { cls: 'lc-rose',   label: 'Rosa',    light: '#9f1239', dark: '#fda4af' },
]

export function RichEditor({
  value,
  onChange,
  placeholder = 'Scrivi il contenuto della lezione...',
  minHeight = '220px',
}: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const composing = useRef(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showColors, setShowColors] = useState(false)
  const savedRangeRef = useRef<Range | null>(null)

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val ?? undefined)
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }, [onChange])

  const handleInput = useCallback(() => {
    if (!composing.current && editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      exec('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;')
    }
  }

  const insertLink = () => {
    const url = window.prompt('URL del enlace:', 'https://')
    if (url) exec('createLink', url)
  }

  const handleImageBtnMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange()
    }
    imageInputRef.current?.click()
  }

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setUploadingImage(true)
    try {
      const form = new FormData()
      form.append('image', file)
      const res = await fetch('/api/admin/lessons/upload-image', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir imagen')

      const editor = editorRef.current
      if (editor) {
        editor.focus()
        const sel = window.getSelection()
        if (savedRangeRef.current && sel) {
          sel.removeAllRanges()
          sel.addRange(savedRangeRef.current)
        }
        document.execCommand('insertHTML', false,
          `<img src="${data.url}" alt="imagen" style="max-width:100%;border-radius:8px;margin:8px 0;" />`
        )
        onChange(editor.innerHTML)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      setUploadingImage(false)
    }
  }

  // Save selection before opening the color picker (button click blurs the editor)
  const handleColorBtnMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange()
    }
    setShowColors(v => !v)
  }

  const applyColorClass = (cls: string) => {
    setShowColors(false)
    const editor = editorRef.current
    if (!editor) return

    editor.focus()
    const sel = window.getSelection()

    // Restore saved selection if browser lost it when picker opened
    if (savedRangeRef.current && sel) {
      sel.removeAllRanges()
      sel.addRange(savedRangeRef.current)
    }

    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    if (range.collapsed) return

    // Clone selection HTML to preserve nested formatting (bold, italic, etc.)
    const fragment = range.cloneContents()
    const tmp = document.createElement('div')
    tmp.appendChild(fragment)
    const selectedHTML = tmp.innerHTML

    // execCommand('insertHTML') goes into the browser undo stack → Ctrl+Z works
    document.execCommand('insertHTML', false, `<span class="${cls}">${selectedHTML}</span>`)
    onChange(editor.innerHTML)
    savedRangeRef.current = null
  }

  const removeColor = () => {
    setShowColors(false)
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    const sel = window.getSelection()
    if (savedRangeRef.current && sel) {
      sel.removeAllRanges()
      sel.addRange(savedRangeRef.current)
    }
    // execCommand('removeFormat') is undoable via Ctrl+Z
    document.execCommand('removeFormat')
    onChange(editor.innerHTML)
    savedRangeRef.current = null
  }

  return (
    <div className="rounded-xl border border-verde-800/40 overflow-visible focus-within:border-verde-600 transition-colors">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-verde-950/60 border-b border-verde-800/30 rounded-t-xl">
        <ToolBtn title="Negrita (Ctrl+B)" onClick={() => exec('bold')}>
          <Bold size={13} />
        </ToolBtn>
        <ToolBtn title="Cursiva (Ctrl+I)" onClick={() => exec('italic')}>
          <Italic size={13} />
        </ToolBtn>

        <Sep />

        <ToolBtn title="Título H2" onClick={() => exec('formatBlock', 'h2')}>
          <Heading2 size={14} />
        </ToolBtn>
        <ToolBtn title="Título H3" onClick={() => exec('formatBlock', 'h3')}>
          <Heading3 size={14} />
        </ToolBtn>
        <ToolBtn title="Párrafo normal" onClick={() => exec('formatBlock', 'p')}>
          <span className="text-[10px] font-bold leading-none">¶</span>
        </ToolBtn>

        <Sep />

        <ToolBtn title="Lista con viñetas" onClick={() => exec('insertUnorderedList')}>
          <List size={13} />
        </ToolBtn>
        <ToolBtn title="Lista numerada" onClick={() => exec('insertOrderedList')}>
          <ListOrdered size={13} />
        </ToolBtn>
        <ToolBtn title="Cita / Blockquote" onClick={() => exec('formatBlock', 'blockquote')}>
          <Quote size={13} />
        </ToolBtn>
        <ToolBtn title="Línea separadora" onClick={() => exec('insertHorizontalRule')}>
          <Minus size={13} />
        </ToolBtn>
        <ToolBtn title="Insertar enlace" onClick={insertLink}>
          <Link2 size={13} />
        </ToolBtn>

        <Sep />

        {/* Color picker */}
        <div className="relative">
          <ToolBtn
            title="Color de texto (selecciona texto primero)"
            onClick={() => {}}
            onMouseDown={handleColorBtnMouseDown}
          >
            <Palette size={13} />
          </ToolBtn>
          {showColors && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-verde-950 border border-verde-700/50 rounded-xl p-2 shadow-xl min-w-[180px]">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-semibold text-verde-400 uppercase tracking-wide">Color de texto</span>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); setShowColors(false) }}
                  className="text-verde-600 hover:text-verde-300"
                >
                  <X size={11} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {COLOR_PALETTE.map(c => (
                  <button
                    key={c.cls}
                    type="button"
                    title={`${c.label} (claro: ${c.light} / oscuro: ${c.dark})`}
                    onMouseDown={e => { e.preventDefault(); applyColorClass(c.cls) }}
                    className="w-7 h-7 rounded-lg border-2 border-transparent hover:border-white/40 transition-all flex items-center justify-center"
                    style={{ backgroundColor: c.dark }}
                  >
                    <span className="sr-only">{c.label}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); removeColor() }}
                className="w-full text-[10px] text-verde-500 hover:text-verde-200 hover:bg-verde-900/50 rounded-lg py-1 transition-colors border border-verde-800/30"
              >
                ✕ Quitar color
              </button>
            </div>
          )}
        </div>

        <Sep />

        {/* Image upload */}
        <input
          ref={imageInputRef}
          type="file"
          className="hidden"
          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
          onChange={handleImageFileChange}
        />
        <ToolBtn
          title="Insertar imagen (PNG, JPG, GIF)"
          onClick={() => {/* handled by onMouseDown */}}
          onMouseDown={handleImageBtnMouseDown}
          disabled={uploadingImage}
        >
          {uploadingImage
            ? <Loader2 size={13} className="animate-spin" />
            : <ImagePlus size={13} />}
        </ToolBtn>

        <Sep />

        <ToolBtn title="Deshacer (Ctrl+Z)" onClick={() => exec('undo')}>
          <Undo2 size={13} />
        </ToolBtn>
        <ToolBtn title="Rehacer (Ctrl+Y)" onClick={() => exec('redo')}>
          <Redo2 size={13} />
        </ToolBtn>

        <div className="ml-auto flex items-center gap-1">
          <ToolBtn
            title="Limpiar formato"
            onClick={() => { exec('selectAll'); exec('removeFormat') }}
          >
            <span className="text-[10px] font-bold leading-none px-0.5">Tx</span>
          </ToolBtn>
        </div>
      </div>

      {/* ── Editable area ── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => { composing.current = true }}
        onCompositionEnd={() => { composing.current = false; handleInput() }}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className={[
          'px-4 py-3 text-sm text-verde-200 focus:outline-none bg-verde-950/30 rounded-b-xl',
          'prose prose-invert prose-sm max-w-none',
          '[&_h2]:text-verde-200 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2',
          '[&_h3]:text-verde-300 [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1',
          '[&_p]:text-verde-300 [&_p]:mb-2 [&_p]:leading-relaxed',
          '[&_strong]:text-verde-100 [&_em]:text-verde-300 [&_em]:italic',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-verde-300 [&_ul]:space-y-0.5',
          '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-verde-300 [&_ol]:space-y-0.5',
          '[&_li]:text-verde-300',
          '[&_blockquote]:rounded-xl [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:my-3 [&_blockquote]:border-l-4',
          '[&_blockquote.tip]:bg-amber-950/30 [&_blockquote.tip]:border-amber-600/50 [&_blockquote.tip]:text-amber-200',
          '[&_blockquote.info]:bg-blue-950/30 [&_blockquote.info]:border-blue-600/50 [&_blockquote.info]:text-blue-200',
          '[&_blockquote.dialogo]:bg-verde-950/30 [&_blockquote.dialogo]:border-verde-600/50 [&_blockquote.dialogo]:font-mono [&_blockquote.dialogo]:text-xs [&_blockquote.dialogo]:text-verde-300',
          '[&_blockquote:not(.tip):not(.info):not(.dialogo)]:border-verde-700 [&_blockquote:not(.tip):not(.info):not(.dialogo)]:text-verde-400 [&_blockquote:not(.tip):not(.info):not(.dialogo)]:italic',
          '[&_a]:text-verde-400 [&_a]:underline',
          '[&_hr]:border-verde-800/40 [&_hr]:my-3',
          '[&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2',
          '[&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:text-xs',
          '[&_th]:bg-verde-900/60 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-verde-200 [&_th]:font-bold [&_th]:text-left [&_th]:border [&_th]:border-verde-700/30',
          '[&_td]:px-2 [&_td]:py-1.5 [&_td]:text-verde-300 [&_td]:border [&_td]:border-verde-800/30',
          'empty:before:content-[attr(data-placeholder)] empty:before:text-verde-700 empty:before:pointer-events-none',
        ].join(' ')}
      />
    </div>
  )
}

function ToolBtn({
  children, title, onClick, onMouseDown, disabled,
}: {
  children: React.ReactNode
  title: string
  onClick: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={onMouseDown ?? ((e) => { e.preventDefault(); onClick() })}
      className="p-1.5 rounded text-verde-500 hover:text-verde-200 hover:bg-verde-900/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="w-px h-4 bg-verde-800/40 mx-1 shrink-0" />
}

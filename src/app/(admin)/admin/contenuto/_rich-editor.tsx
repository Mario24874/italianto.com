'use client'

import { useRef, useEffect, useCallback } from 'react'
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Quote, Minus, Undo2, Redo2, Link2,
} from 'lucide-react'

interface RichEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

export function RichEditor({ value, onChange, placeholder = 'Scrivi il contenuto della lezione...', minHeight = '220px' }: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const composing = useRef(false)

  // Set initial content only on first mount
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

  return (
    <div className="rounded-xl border border-verde-800/40 overflow-hidden focus-within:border-verde-600 transition-colors">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-verde-950/60 border-b border-verde-800/30">
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
          'px-4 py-3 text-sm text-verde-200 focus:outline-none bg-verde-950/30',
          'prose prose-invert prose-sm max-w-none',
          '[&_h2]:text-verde-200 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2',
          '[&_h3]:text-verde-300 [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1',
          '[&_p]:text-verde-300 [&_p]:mb-2 [&_p]:leading-relaxed',
          '[&_strong]:text-verde-100 [&_em]:text-verde-300 [&_em]:italic',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-verde-300 [&_ul]:space-y-0.5',
          '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-verde-300 [&_ol]:space-y-0.5',
          '[&_li]:text-verde-300',
          '[&_blockquote]:border-l-2 [&_blockquote]:border-verde-700 [&_blockquote]:pl-3',
          '[&_blockquote]:text-verde-400 [&_blockquote]:italic [&_blockquote]:my-2',
          '[&_a]:text-verde-400 [&_a]:underline',
          '[&_hr]:border-verde-800/40 [&_hr]:my-3',
          'empty:before:content-[attr(data-placeholder)] empty:before:text-verde-700 empty:before:pointer-events-none',
        ].join(' ')}
      />
    </div>
  )
}

function ToolBtn({ children, title, onClick }: {
  children: React.ReactNode
  title: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={title}
      // onMouseDown prevents blur on the editor
      onMouseDown={e => { e.preventDefault(); onClick() }}
      className="p-1.5 rounded text-verde-500 hover:text-verde-200 hover:bg-verde-900/50 transition-colors"
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="w-px h-4 bg-verde-800/40 mx-1 shrink-0" />
}

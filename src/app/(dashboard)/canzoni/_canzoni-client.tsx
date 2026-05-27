'use client'

import { useState, useEffect } from 'react'
import { Music, Play, X, FileMusic, FileVideo, Search, ListMusic, Plus, Trash2 } from 'lucide-react'
import type { PlanType } from '@/lib/plans'
import { useLanguage } from '@/contexts/language-context'
import { useMusicPlayer } from '@/contexts/music-player-context'
import type { SongRow } from '@/contexts/music-player-context'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export type { SongRow }

const GENRE_COLORS: Record<string, string> = {
  pop:        'bg-pink-900/40 text-pink-300 border-pink-700/30',
  classica:   'bg-purple-900/40 text-purple-300 border-purple-700/30',
  rock:       'bg-orange-900/40 text-orange-300 border-orange-700/30',
  romantica:  'bg-red-900/40 text-red-300 border-red-700/30',
  balada:     'bg-blue-900/40 text-blue-300 border-blue-700/30',
  jazz:       'bg-yellow-900/40 text-yellow-300 border-yellow-700/30',
  folk:       'bg-green-900/40 text-green-300 border-green-700/30',
  opera:      'bg-indigo-900/40 text-indigo-300 border-indigo-700/30',
  napolitana: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/30',
}

const PLAYLIST_KEY = 'italianto-song-list'

function loadStoredList(): string[] {
  try { return JSON.parse(localStorage.getItem(PLAYLIST_KEY) ?? '[]') } catch { return [] }
}

function saveStoredList(ids: string[]) {
  try { localStorage.setItem(PLAYLIST_KEY, JSON.stringify(ids)) } catch {}
}

function EqualizerBars({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className="text-pink-400">
      <rect x="1" y="9" width="3" height="9" rx="1" fill="currentColor">
        <animate attributeName="height" values="9;15;4;13;6;9" dur="1.1s" repeatCount="indefinite" />
        <animate attributeName="y" values="9;3;14;5;12;9" dur="1.1s" repeatCount="indefinite" />
      </rect>
      <rect x="7" y="5" width="3" height="13" rx="1" fill="currentColor">
        <animate attributeName="height" values="13;5;15;4;11;13" dur="0.85s" repeatCount="indefinite" />
        <animate attributeName="y" values="5;13;3;14;7;5" dur="0.85s" repeatCount="indefinite" />
      </rect>
      <rect x="13" y="7" width="3" height="11" rx="1" fill="currentColor">
        <animate attributeName="height" values="11;15;5;13;8;11" dur="1.35s" repeatCount="indefinite" />
        <animate attributeName="y" values="7;3;13;5;10;7" dur="1.35s" repeatCount="indefinite" />
      </rect>
    </svg>
  )
}

export function CanzoniClient({
  songs,
  userPlan,
  planHierarchy,
}: {
  songs: SongRow[]
  userPlan: PlanType
  planHierarchy: PlanType[]
}) {
  const { t } = useLanguage()
  const ct = t.canzoni
  const { currentSong, playSong, isMinimized, modalOpen } = useMusicPlayer()

  const [search, setSearch] = useState('')
  const [activeGenre, setActiveGenre] = useState<string | null>(null)
  const [view, setView] = useState<'all' | 'list'>('all')
  const [myList, setMyList] = useState<string[]>([])

  useEffect(() => { setMyList(loadStoredList()) }, [])

  function hasAccess(required: string) {
    return planHierarchy.indexOf(userPlan) >= planHierarchy.indexOf(required as PlanType)
  }

  const accessible = songs.filter(s => hasAccess(s.plan_required))

  // Unique genres that exist in accessible songs
  const availableGenres = Array.from(
    new Set(accessible.map(s => s.genre).filter((g): g is string => !!g))
  ).sort()

  const baseList = view === 'list'
    ? accessible.filter(s => myList.includes(s.id))
    : accessible

  const filtered = baseList.filter(s => {
    const matchSearch = !search.trim() ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase())
    const matchGenre = !activeGenre || s.genre === activeGenre
    return matchSearch && matchGenre
  })

  function open(idx: number) {
    playSong(filtered[idx], filtered, idx)
  }

  function toggleList(song: SongRow) {
    setMyList(prev => {
      const next = prev.includes(song.id)
        ? prev.filter(id => id !== song.id)
        : [...prev, song.id]
      saveStoredList(next)
      toast(prev.includes(song.id) ? ct.listRemoved : ct.listAdded, { duration: 1500 })
      return next
    })
  }

  function playAll() {
    if (filtered.length === 0) return
    playSong(filtered[0], filtered, 0)
  }

  const isActive = (song: SongRow) =>
    currentSong?.id === song.id && (modalOpen || isMinimized)

  if (songs.length === 0) {
    return (
      <div className="text-center py-20">
        <Music size={48} className="text-verde-800 mx-auto mb-4" />
        <p className="text-verde-500">{ct.emptyState}</p>
      </div>
    )
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setView('all')}
          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            view === 'all' ? 'bg-pink-900/40 text-pink-200 border border-pink-700/40' : 'text-verde-500 hover:text-verde-300 hover:bg-verde-950/40')}
        >
          <Music size={14} /> {ct.allSongs}
        </button>
        <button
          onClick={() => setView('list')}
          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            view === 'list' ? 'bg-pink-900/40 text-pink-200 border border-pink-700/40' : 'text-verde-500 hover:text-verde-300 hover:bg-verde-950/40')}
        >
          <ListMusic size={14} />
          {ct.myList}
          {myList.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-pink-700/40 text-pink-200">{myList.length}</span>
          )}
        </button>

        {view === 'list' && filtered.length > 0 && (
          <button
            onClick={playAll}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-verde-700 hover:bg-verde-600 text-white transition-colors"
          >
            <Play size={13} /> {ct.playAll}
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-verde-600 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={ct.searchPlaceholder}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-verde-950/40 border border-verde-800/30 text-verde-200 text-sm placeholder:text-verde-700 focus:outline-none focus:border-verde-600 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-verde-600 hover:text-verde-300 transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Genre filter pills — only shown when genres exist */}
      {availableGenres.length > 0 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveGenre(null)}
            className={cn('shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              !activeGenre
                ? 'bg-pink-900/40 text-pink-200 border-pink-700/40'
                : 'text-verde-600 border-verde-900/40 hover:border-verde-700 hover:text-verde-300')}
          >
            {ct.allGenres}
          </button>
          {availableGenres.map(genre => (
            <button
              key={genre}
              onClick={() => setActiveGenre(g => g === genre ? null : genre)}
              className={cn(
                'shrink-0 px-3 py-1 rounded-full text-xs font-medium border capitalize transition-colors',
                activeGenre === genre
                  ? (GENRE_COLORS[genre] ?? 'bg-pink-900/40 text-pink-200 border-pink-700/40')
                  : 'text-verde-600 border-verde-900/40 hover:border-verde-700 hover:text-verde-300'
              )}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {/* Song list */}
      {view === 'list' && myList.length === 0 ? (
        <div className="text-center py-16">
          <ListMusic size={32} className="text-verde-800 mx-auto mb-3" />
          <p className="text-verde-500 text-sm">{ct.emptyList}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Search size={32} className="text-verde-800 mx-auto mb-3" />
          <p className="text-verde-500 text-sm">{ct.noResults}</p>
        </div>
      ) : (
        <div className={cn('space-y-2', (modalOpen || isMinimized) && 'pb-24')}>
          {filtered.map((song, idx) => {
            const hasContent = song.audio_url || song.video_url || song.lyrics?.trim()
            const playing = isActive(song)
            const inList = myList.includes(song.id)
            return (
              <div key={song.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-2xl border transition-all',
                  playing
                    ? 'border-pink-700/50 bg-pink-950/20'
                    : 'border-verde-900/30 bg-verde-950/20 hover:bg-verde-950/40 hover:border-verde-800/50'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0',
                  playing ? 'bg-pink-900/40 border-pink-700/40' : 'bg-pink-950/40 border-pink-800/30'
                )}>
                  {playing ? <EqualizerBars /> : <Music size={18} className="text-pink-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-verde-200 truncate">{song.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-verde-500 truncate">{song.artist}</span>
                    {song.genre && (
                      <span className={cn('shrink-0 px-1.5 py-0.5 rounded-full text-xs border capitalize',
                        GENRE_COLORS[song.genre] ?? 'bg-verde-900/40 text-verde-400 border-verde-700/30')}>
                        {song.genre}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Add/Remove from list */}
                  <button
                    onClick={() => toggleList(song)}
                    title={inList ? ct.removeFromList : ct.addToList}
                    className={cn('p-1.5 rounded-lg transition-colors',
                      inList
                        ? 'text-pink-400 bg-pink-900/30 border border-pink-800/40 hover:text-red-400'
                        : 'text-verde-700 hover:text-pink-400 hover:bg-pink-950/30 border border-transparent')}
                  >
                    {inList ? <Trash2 size={13} /> : <Plus size={13} />}
                  </button>

                  {/* Play button */}
                  {hasContent && (
                    <button onClick={() => open(idx)}
                      className={cn(
                        'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors',
                        playing
                          ? 'bg-pink-800/40 border-pink-700/50 text-pink-200'
                          : 'bg-pink-900/30 border-pink-800/40 text-pink-300 hover:bg-pink-900/50'
                      )}
                    >
                      {song.video_url ? <FileVideo size={12} /> : song.audio_url ? <Play size={12} /> : <FileMusic size={12} />}
                      {song.video_url ? ct.watch : song.audio_url ? ct.listen : ct.lyrics}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

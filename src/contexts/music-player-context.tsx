'use client'

import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from 'react'

export interface SongRow {
  id: string
  slug: string
  title: string
  artist: string
  lyrics: string | null
  level: string
  plan_required: string
  audio_url: string | null
  video_url: string | null
  genre: string | null
}

interface MusicPlayerContextValue {
  currentSong: SongRow | null
  playlist: SongRow[]
  currentIndex: number
  autoplay: boolean
  modalOpen: boolean
  isMinimized: boolean
  playSong: (song: SongRow, playlist: SongRow[], index: number) => void
  closeSong: () => void
  minimize: () => void
  expand: () => void
  next: () => void
  prev: () => void
  toggleAutoplay: () => void
  audioRef: React.RefObject<HTMLAudioElement | null>
}

const MusicPlayerContext = createContext<MusicPlayerContextValue>({
  currentSong: null,
  playlist: [],
  currentIndex: 0,
  autoplay: false,
  modalOpen: false,
  isMinimized: false,
  playSong: () => {},
  closeSong: () => {},
  minimize: () => {},
  expand: () => {},
  next: () => {},
  prev: () => {},
  toggleAutoplay: () => {},
  audioRef: { current: null },
})

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<SongRow | null>(null)
  const [playlist, setPlaylist] = useState<SongRow[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoplay, setAutoplay] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playlistRef = useRef<SongRow[]>([])

  useEffect(() => { playlistRef.current = playlist }, [playlist])

  const playSong = useCallback((song: SongRow, pl: SongRow[], idx: number) => {
    setCurrentSong(song)
    setPlaylist(pl)
    setCurrentIndex(idx)
    setModalOpen(true)
    setIsMinimized(false)
  }, [])

  const closeSong = useCallback(() => {
    audioRef.current?.pause()
    setCurrentSong(null)
    setPlaylist([])
    setCurrentIndex(0)
    setModalOpen(false)
    setIsMinimized(false)
  }, [])

  const minimize = useCallback(() => {
    setModalOpen(false)
    setIsMinimized(true)
  }, [])

  const expand = useCallback(() => {
    setModalOpen(true)
    setIsMinimized(false)
  }, [])

  const next = useCallback(() => {
    setCurrentIndex(i => {
      const n = i + 1
      if (n < playlistRef.current.length) {
        setCurrentSong(playlistRef.current[n])
        return n
      }
      return i
    })
  }, [])

  const prev = useCallback(() => {
    setCurrentIndex(i => {
      const p = i - 1
      if (p >= 0) {
        setCurrentSong(playlistRef.current[p])
        return p
      }
      return i
    })
  }, [])

  const toggleAutoplay = useCallback(() => setAutoplay(a => !a), [])

  // Autoplay native audio when song changes
  useEffect(() => {
    if (!autoplay || !currentSong?.audio_url || currentSong.video_url) return
    audioRef.current?.play().catch(() => {})
  }, [currentSong?.id, autoplay, currentSong?.audio_url, currentSong?.video_url])

  return (
    <MusicPlayerContext.Provider value={{
      currentSong, playlist, currentIndex, autoplay,
      modalOpen, isMinimized,
      playSong, closeSong, minimize, expand,
      next, prev, toggleAutoplay, audioRef,
    }}>
      {children}
      {/* Native audio — lives outside modal so it persists across navigation */}
      {currentSong?.audio_url && !currentSong.video_url && (
        <audio
          ref={audioRef}
          key={currentSong.id}
          src={currentSong.audio_url}
          onEnded={() => { if (autoplay) next() }}
        />
      )}
    </MusicPlayerContext.Provider>
  )
}

export const useMusicPlayer = () => useContext(MusicPlayerContext)

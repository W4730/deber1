import { useState } from 'react'
import { getVolume, setVolume } from './music'

interface Props {
  loading: boolean
  error: string
  onStart: () => void
  onCredits: () => void
}

export function VolumeSlider() {
  const [v, setV] = useState(getVolume())
  return (
    <label className="volume">
      🎵
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={v}
        onChange={(e) => {
          setV(+e.target.value)
          setVolume(+e.target.value)
        }}
        aria-label="Volumen de la música"
      />
    </label>
  )
}

type Theme = 'light' | 'dark'

export function initTheme() {
  let saved: string | null = null
  try {
    saved = localStorage.getItem('theme')
  } catch {}
  const theme = saved ?? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
  document.documentElement.dataset.theme = theme
}

export function ThemeToggle() {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme as Theme)
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {}
    setTheme(next)
  }
  return (
    <button onClick={toggle} aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}

export default function Menu({ loading, error, onStart, onCredits }: Props) {
  return (
    <div className="screen">
      <h1 className="title">Bounce a' bol</h1>
      <div className="bouncer" />
      <button onClick={onStart} disabled={loading || !!error}>
        {loading ? 'Cargando…' : 'Empezar'}
      </button>
      <button onClick={onCredits}>Créditos</button>
      {error && <p className="error">Error: {error}</p>}
      <div className="row">
        <VolumeSlider />
        <ThemeToggle />
      </div>
    </div>
  )
}

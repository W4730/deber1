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
      <VolumeSlider />
    </div>
  )
}

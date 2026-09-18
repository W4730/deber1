import { useState } from 'react'
import { rgb, type Ball, type BallInput } from './types'

interface Props {
  ball: Ball | null
  onSave: (b: BallInput) => Promise<void>
  onDelete?: () => Promise<void>
  onCancel: () => void
}

const hex = (c: BallInput) => '#' + [c.r, c.g, c.b].map((n) => n.toString(16).padStart(2, '0')).join('')
const fromHex = (h: string) => ({ r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) })

export default function Editor({ ball, onSave, onDelete, onCancel }: Props) {
  const [form, setForm] = useState<BallInput>(ball ?? { name: '', r: 255, g: 120, b: 80 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = (action: () => Promise<void>) => async () => {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  const name = form.name.trim()

  return (
    <div className="screen">
      <h1>{ball ? 'Editar pelota' : 'Nueva pelota'}</h1>
      <div className="preview" style={{ backgroundColor: rgb(form) }} />
      <input
        className="name"
        placeholder="Nombre"
        maxLength={20}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input type="color" className="picker" value={hex(form)} onChange={(e) => setForm({ ...form, ...fromHex(e.target.value) })} />
      {(['r', 'g', 'b'] as const).map((k) => (
        <label key={k} className="channel">
          {k.toUpperCase()}
          <input type="range" min={0} max={255} value={form[k]} onChange={(e) => setForm({ ...form, [k]: +e.target.value })} />
          <span>{form[k]}</span>
        </label>
      ))}
      <div className="row">
        <button onClick={run(() => onSave({ ...form, name }))} disabled={busy || !name}>
          {busy ? 'Guardando…' : 'Listo'}
        </button>
        {onDelete && (
          <button className="danger" onClick={run(onDelete)} disabled={busy}>
            Borrar
          </button>
        )}
        <button onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
      </div>
      {error && <p className="error">Error: {error}</p>}
    </div>
  )
}

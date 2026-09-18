import { useEffect, useState } from 'react'
import type { Ball, BallInput } from './types'
import { listBalls, createBall, updateBall, deleteBall } from './api'
import { startMusic } from './music'
import Menu from './Menu'
import Editor from './Editor'
import Game from './Game'

type Screen = 'menu' | 'credits' | 'edit' | 'game'

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [balls, setBalls] = useState<Ball[]>([])
  const [editing, setEditing] = useState<Ball | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listBalls()
      .then(setBalls)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // Browsers only allow audio after a user gesture.
  useEffect(() => {
    const start = () => startMusic()
    window.addEventListener('pointerdown', start, { once: true })
    return () => window.removeEventListener('pointerdown', start)
  }, [])

  const edit = (ball: Ball | null) => {
    setEditing(ball)
    setScreen('edit')
  }

  const save = async (input: BallInput) => {
    if (editing) {
      const saved = await updateBall({ ...input, id: editing.id })
      setBalls((bs) => bs.map((b) => (b.id === saved.id ? saved : b)))
    } else {
      const saved = await createBall(input)
      setBalls((bs) => [...bs, saved])
    }
    setScreen('game')
  }

  const remove = async () => {
    await deleteBall(editing!.id)
    const rest = balls.filter((b) => b.id !== editing!.id)
    setBalls(rest)
    if (rest.length) setScreen('game')
    else edit(null)
  }

  if (screen === 'menu')
    return (
      <Menu
        loading={loading}
        error={error}
        onStart={() => (balls.length ? setScreen('game') : edit(null))}
        onCredits={() => setScreen('credits')}
      />
    )

  if (screen === 'credits')
    return (
      <div className="screen">
        <h1>Créditos</h1>
        <p>Bounce a' bol — Entregable 1, Tecnologías Emergentes</p>
        <p>Desarrollado por Alex Romero</p>
        <p>Música ambiental generada con Web Audio API</p>
        <button onClick={() => setScreen('menu')}>Volver</button>
      </div>
    )

  if (screen === 'edit')
    return (
      <Editor
        ball={editing}
        onSave={save}
        onDelete={editing ? remove : undefined}
        onCancel={balls.length ? () => setScreen('game') : () => setScreen('menu')}
      />
    )

  return <Game balls={balls} onEdit={edit} onMenu={() => setScreen('menu')} />
}

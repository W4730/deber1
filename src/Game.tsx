import { useEffect, useRef } from 'react'
import { rgb, type Ball } from './types'
import { VolumeSlider } from './Menu'

interface Props {
  balls: Ball[]
  onEdit: (b: Ball | null) => void
  onMenu: () => void
}

interface Body {
  x: number
  y: number
  vx: number
  vy: number
}

const R = 30
const GRAVITY = 1500 // px/s²
const BOUNCE = 0.8
const FRICTION = 0.995 // per frame, along the floor/air

// Survives screen changes so balls stay where you left them.
const bodies = new Map<string, Body>()

export default function Game({ balls, onEdit, onMenu }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ballsRef = useRef(balls)
  ballsRef.current = balls

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let grabbed: { id: string; dx: number; dy: number; trail: { x: number; y: number; t: number }[] } | null = null
    let last = performance.now()
    let frame = 0

    const bodyOf = (b: Ball) => {
      let body = bodies.get(b.id)
      if (!body) {
        body = { x: R + Math.random() * (canvas.width - 2 * R), y: R, vx: (Math.random() - 0.5) * 400, vy: 0 }
        bodies.set(b.id, body)
      }
      return body
    }

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const w = (canvas.width = canvas.clientWidth)
      const h = (canvas.height = canvas.clientHeight)

      for (const b of ballsRef.current) {
        const p = bodyOf(b)
        if (grabbed?.id !== b.id) {
          p.vy += GRAVITY * dt
          p.vx *= FRICTION
          p.x += p.vx * dt
          p.y += p.vy * dt
        }
        if (p.x < R) (p.x = R), (p.vx = Math.abs(p.vx) * BOUNCE)
        if (p.x > w - R) (p.x = w - R), (p.vx = -Math.abs(p.vx) * BOUNCE)
        if (p.y < R) (p.y = R), (p.vy = Math.abs(p.vy) * BOUNCE)
        if (p.y > h - R) (p.y = h - R), (p.vy = -Math.abs(p.vy) * BOUNCE)

        ctx.beginPath()
        ctx.arc(p.x, p.y, R, 0, Math.PI * 2)
        ctx.fillStyle = rgb(b)
        ctx.fill()
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    const down = (e: PointerEvent) => {
      // Topmost ball = last drawn.
      const hit = [...ballsRef.current].reverse().find((b) => {
        const p = bodyOf(b)
        return Math.hypot(p.x - e.offsetX, p.y - e.offsetY) <= R
      })
      if (!hit) return
      const p = bodyOf(hit)
      grabbed = { id: hit.id, dx: p.x - e.offsetX, dy: p.y - e.offsetY, trail: [] }
      canvas.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!grabbed) return
      const p = bodies.get(grabbed.id)!
      p.x = e.offsetX + grabbed.dx
      p.y = e.offsetY + grabbed.dy
      p.vx = p.vy = 0
      grabbed.trail.push({ x: p.x, y: p.y, t: e.timeStamp })
      grabbed.trail = grabbed.trail.filter((s) => e.timeStamp - s.t < 100)
    }
    const up = (e: PointerEvent) => {
      if (!grabbed) return
      const p = bodies.get(grabbed.id)!
      const first = grabbed.trail[0]
      const dt = first ? (e.timeStamp - first.t) / 1000 : 0
      if (dt > 0) {
        p.vx = (p.x - first.x) / dt
        p.vy = (p.y - first.y) / dt
      }
      grabbed = null
    }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)

    return () => {
      cancelAnimationFrame(frame)
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
    }
  }, [])

  return (
    <div className="game">
      <canvas ref={canvasRef} />
      <div className="bar">
        <button onClick={onMenu} aria-label="Menú">☰</button>
        {balls.map((b) => (
          <button key={b.id} className="tag" style={{ borderColor: rgb(b) }} onClick={() => onEdit(b)}>
            <span className="dot" style={{ background: rgb(b) }} />
            {b.name}
          </button>
        ))}
        <button onClick={() => onEdit(null)} aria-label="Agregar pelota">+</button>
        <VolumeSlider />
      </div>
    </div>
  )
}

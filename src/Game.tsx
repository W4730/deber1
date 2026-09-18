import { useEffect, useRef } from 'react'
import { rgb, type Ball } from './types'
import { VolumeSlider, ThemeToggle } from './Menu'
import { plop } from './music'

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

      const list = ballsRef.current.map((b) => ({ b, p: bodyOf(b), held: grabbed?.id === b.id }))

      for (const { p, held } of list) {
        if (held) {
          p.vx *= 0.8 // dragged velocity fades when the mouse stops
          p.vy *= 0.8
          continue
        }
        p.vy += GRAVITY * dt
        p.vx *= FRICTION
        p.x += p.vx * dt
        p.y += p.vy * dt
      }

      // ponytail: O(n²) pair check, fine for dozens of balls; spatial grid if hundreds.
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i], c = list[j]
          const dx = c.p.x - a.p.x, dy = c.p.y - a.p.y
          const dist = Math.hypot(dx, dy)
          if (dist >= 2 * R || dist === 0) continue
          const nx = dx / dist, ny = dy / dist
          // The held ball acts like a wall: infinite mass.
          const ia = a.held ? 0 : 1, ic = c.held ? 0 : 1
          if (ia + ic === 0) continue
          const push = (2 * R - dist) / (ia + ic)
          a.p.x -= nx * push * ia; a.p.y -= ny * push * ia
          c.p.x += nx * push * ic; c.p.y += ny * push * ic
          const vn = (c.p.vx - a.p.vx) * nx + (c.p.vy - a.p.vy) * ny
          if (vn >= 0) continue
          const imp = (-(1 + BOUNCE) * vn) / (ia + ic)
          a.p.vx -= imp * nx * ia; a.p.vy -= imp * ny * ia
          c.p.vx += imp * nx * ic; c.p.vy += imp * ny * ic
          plop(-vn)
        }
      }

      for (const { b, p } of list) {
        if (p.x < R) plop(-p.vx), (p.x = R), (p.vx = Math.abs(p.vx) * BOUNCE)
        if (p.x > w - R) plop(p.vx), (p.x = w - R), (p.vx = -Math.abs(p.vx) * BOUNCE)
        if (p.y < R) plop(-p.vy), (p.y = R), (p.vy = Math.abs(p.vy) * BOUNCE)
        if (p.y > h - R) plop(p.vy), (p.y = h - R), (p.vy = -Math.abs(p.vy) * BOUNCE)

        ctx.beginPath()
        ctx.arc(p.x, p.y, R, 0, Math.PI * 2)
        ctx.fillStyle = rgb(b)
        ctx.fill()
        // Plastic look: soft white highlight up-left.
        const hx = p.x - R * 0.35, hy = p.y - R * 0.4
        const shine = ctx.createRadialGradient(hx, hy, 0, hx, hy, R * 0.55)
        shine.addColorStop(0, 'rgba(255,255,255,0.85)')
        shine.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = shine
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
      const x = e.offsetX + grabbed.dx
      const y = e.offsetY + grabbed.dy
      const prev = grabbed.trail[grabbed.trail.length - 1]
      const dt = prev ? (e.timeStamp - prev.t) / 1000 : 0
      // Keep a velocity while dragging so the held ball can smack others.
      if (dt > 0) (p.vx = (x - p.x) / dt), (p.vy = (y - p.y) / dt)
      p.x = x
      p.y = y
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
        <ThemeToggle />
      </div>
    </div>
  )
}

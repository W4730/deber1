// Relaxing ambient pad synthesized with Web Audio — no audio files, no licensing.
let ctx: AudioContext | null = null
let master: GainNode
let volume = 0.5

// Cmaj7 → Am7 → Fmaj7 → G6, in Hz
const CHORDS = [
  [261.63, 329.63, 392.0, 493.88],
  [220.0, 261.63, 329.63, 392.0],
  [174.61, 220.0, 261.63, 329.63],
  [196.0, 246.94, 293.66, 329.63],
]
const CHORD_SECONDS = 6

function playChord(freqs: number[], at: number) {
  const c = ctx!
  const env = c.createGain()
  env.gain.setValueAtTime(0, at)
  env.gain.linearRampToValueAtTime(0.08, at + 2)
  env.gain.linearRampToValueAtTime(0, at + CHORD_SECONDS + 2) // overlap with next chord
  env.connect(master)
  for (const f of freqs) {
    for (const detune of [-6, 6]) {
      const o = c.createOscillator()
      o.type = 'sine'
      o.frequency.value = f
      o.detune.value = detune
      o.connect(env)
      o.start(at)
      o.stop(at + CHORD_SECONDS + 2)
    }
  }
}

export function startMusic() {
  if (ctx) return void ctx.resume()
  ctx = new AudioContext()
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 900
  filter.connect(ctx.destination)
  master = ctx.createGain()
  master.gain.value = volume
  master.connect(filter)

  let i = 0
  let next = ctx.currentTime + 0.1
  const schedule = () => {
    while (next < ctx!.currentTime + CHORD_SECONDS) {
      playChord(CHORDS[i++ % CHORDS.length], next)
      next += CHORD_SECONDS
    }
  }
  schedule()
  setInterval(schedule, 1000)
}

export function setVolume(v: number) {
  volume = v
  if (ctx) master.gain.setTargetAtTime(v, ctx.currentTime, 0.1)
}

export const getVolume = () => volume

export interface Ball {
  id: string
  name: string
  r: number
  g: number
  b: number
}

export type BallInput = Omit<Ball, 'id'>

export const rgb = (c: BallInput) => `rgb(${c.r}, ${c.g}, ${c.b})`

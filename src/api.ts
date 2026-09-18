import { createClient } from '@supabase/supabase-js'
import type { Ball, BallInput } from './types'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
const balls = () => supabase.from('balls')

function check<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message)
  return data as T
}

export const listBalls = async () => check<Ball[]>(await balls().select().order('created_at'))
export const createBall = async (b: BallInput) => check<Ball>(await balls().insert(b).select().single())
export const updateBall = async ({ id, ...b }: Ball) => check<Ball>(await balls().update(b).eq('id', id).select().single())
export const deleteBall = async (id: string) => { check(await balls().delete().eq('id', id)) }

import { useEffect, useState } from 'react'

const BASE_INTERVAL = 350

export function useReplay(makespan: number) {
  const [rawTime, setRawTime] = useState(0)
  const [rawPlaying, setRawPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  const max = Math.max(0, makespan - 1)
  const time = Math.min(rawTime, max)
  const atEnd = time >= max
  const playing = rawPlaying && !atEnd

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setRawTime((t) => Math.min(max, t + 1))
    }, BASE_INTERVAL / speed)
    return () => clearInterval(id)
  }, [playing, speed, max])

  const setTime = (t: number) => setRawTime(t)

  const setPlaying = (value: boolean) => setRawPlaying(value)

  const toggle = () => {
    if (rawPlaying) {
      setRawPlaying(false)
      return
    }
    if (atEnd) setRawTime(0)
    setRawPlaying(true)
  }

  const step = (delta: number) =>
    setRawTime((t) => Math.min(max, Math.max(0, t + delta)))

  return {
    time,
    setTime,
    playing,
    setPlaying,
    toggle,
    atEnd,
    speed,
    setSpeed,
    max,
    step,
  }
}

export type Replay = ReturnType<typeof useReplay>

'use client'

import { useEffect, useRef } from 'react'

interface UsePollingOptions {
  intervalMs: number
  enabled?: boolean
}

export function usePolling(callback: () => void | Promise<void>, { intervalMs, enabled = true }: UsePollingOptions) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    let intervalId: ReturnType<typeof setInterval> | null = null

    const run = () => {
      void callbackRef.current()
    }

    const start = () => {
      if (intervalId !== null) return
      intervalId = setInterval(run, intervalMs)
    }

    const stop = () => {
      if (intervalId === null) return
      clearInterval(intervalId)
      intervalId = null
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        run()
        start()
      } else {
        stop()
      }
    }

    run()
    if (document.visibilityState === 'visible') start()

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [intervalMs, enabled])
}

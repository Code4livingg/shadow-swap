import { useCallback, useEffect, useState } from 'react'
import { readMatches, type IntentMatch } from '../contracts/ShadowSwap'

export function useMatches() {
  const [matches, setMatches] = useState<IntentMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshMatches = useCallback(async () => {
    try {
      const nextMatches = await readMatches()
      setMatches(nextMatches)
      setError(null)
    } catch (refreshError) {
      const message =
        refreshError instanceof Error ? refreshError.message : 'Failed to load blind matches.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshMatches()

    const interval = window.setInterval(() => {
      void refreshMatches()
    }, 5000)

    return () => window.clearInterval(interval)
  }, [refreshMatches])

  return {
    error,
    loading,
    matches,
    refreshMatches,
  }
}

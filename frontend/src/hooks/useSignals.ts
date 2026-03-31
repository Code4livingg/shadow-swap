import { useMemo, useState } from 'react'
import type { DemoSignal } from '../components/SignalCard'

const demoSignals: DemoSignal[] = [
  {
    club: 'Shadow Alpha',
    encryptedBody: '███████████████████████████',
    id: '0x7f3a',
    revealedBody: 'BUY ETH · Target 3200 · Stop 2900',
    timestamp: '2 min ago',
  },
  {
    club: 'Cipher Desk',
    encryptedBody: '███████████████████████████',
    id: '0x2b1c',
    revealedBody: 'SELL ARB · Target 1.45 · Stop 1.61',
    timestamp: '7 min ago',
  },
  {
    club: 'Dark Liquidity',
    encryptedBody: '███████████████████████████',
    id: '0x91ce',
    revealedBody: 'NEUTRAL BTC · Monitor 72k breakout',
    timestamp: '14 min ago',
  },
  {
    club: 'Shadow Alpha',
    encryptedBody: '███████████████████████████',
    id: '0xa44d',
    revealedBody: 'ANALYSIS SOL · Absorption near 180',
    timestamp: '23 min ago',
  },
  {
    club: 'Ghost Protocol',
    encryptedBody: '███████████████████████████',
    id: '0xd903',
    revealedBody: 'BUY LINK · Target 24 · Stop 20',
    timestamp: '31 min ago',
  },
] as const

export function useSignals() {
  const [filter, setFilter] = useState<'all' | 'club'>('all')
  const [revealedIds, setRevealedIds] = useState<string[]>([])
  const [decryptingId, setDecryptingId] = useState<string | null>(null)
  const [typedText, setTypedText] = useState<Record<string, string>>({})

  const decryptSignal = async (signalId: string) => {
    const signal = demoSignals.find((item) => item.id === signalId)
    if (!signal) return

    setDecryptingId(signalId)
    await new Promise((resolve) => window.setTimeout(resolve, 800))

    let index = 0
    await new Promise<void>((resolve) => {
      const timer = window.setInterval(() => {
        index += 1
        setTypedText((current) => ({
          ...current,
          [signalId]: signal.revealedBody.slice(0, index),
        }))

        if (index >= signal.revealedBody.length) {
          window.clearInterval(timer)
          resolve()
        }
      }, 28)
    })

    setDecryptingId(null)
    setRevealedIds((current) => (current.includes(signalId) ? current : [...current, signalId]))
  }

  const signals = useMemo(() => {
    if (filter === 'club') {
      return demoSignals.filter((signal) => signal.club === 'Shadow Alpha')
    }

    return demoSignals
  }, [filter])

  return {
    decryptSignal,
    decryptingId,
    filter,
    revealedIds,
    setFilter,
    signals,
    typedText,
  }
}

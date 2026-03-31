import { Lock } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type EncryptAnimationProps = {
  active: boolean
  completedHash?: string | null
  label: string
}

const FRAMES = [
  '████ ████ ████',
  '████████ ████',
  '██████████████',
  '████████████████',
] as const

export function EncryptAnimation({ active, completedHash, label }: EncryptAnimationProps) {
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    if (!active) {
      return
    }

    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % FRAMES.length)
    }, 180)

    return () => window.clearInterval(timer)
  }, [active])

  const statusText = useMemo(() => {
    if (completedHash) {
      return `Order Sealed · ID: ${completedHash.slice(0, 10)}...`
    }

    return 'Sealing order with FHE...'
  }, [completedHash])

  if (!active) {
    return null
  }

  return (
    <div className="encrypt-overlay">
      <div className="encrypt-card">
        <div className="lock-ring">
          <Lock size={18} />
        </div>
        <p className="eyebrow">{label}</p>
        <strong>{statusText}</strong>
        <span className="encrypted-blocks">{FRAMES[frameIndex]}</span>
      </div>
    </div>
  )
}

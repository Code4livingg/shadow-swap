import { useEffect, useMemo, useState } from 'react'

type FeedStatus = 'Intent Encrypted' | 'Searching Liquidity' | 'Match Found' | 'Settlement Complete'

type FeedEntry = {
  hash: string
  id: string
  pair: string
  probability: number
  status: FeedStatus
}

const TOKEN_PAIRS = ['ETH/USDC', 'WBTC/ETH', 'ARB/USDC', 'LINK/ETH', 'UNI/USDC'] as const
const STATUSES: FeedStatus[] = ['Intent Encrypted', 'Searching Liquidity', 'Match Found', 'Settlement Complete']

const randomHex = () => `0x${Math.random().toString(16).slice(2, 10)}`
const randomPair = () => TOKEN_PAIRS[Math.floor(Math.random() * TOKEN_PAIRS.length)]
const randomStatus = () => STATUSES[Math.floor(Math.random() * STATUSES.length)]
const randomProbability = () => Math.floor(Math.random() * 22) + 78

const statusDotClass = (status: FeedStatus) => {
  switch (status) {
    case 'Searching Liquidity':
      return 'bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.75)]'
    case 'Match Found':
      return 'bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.75)]'
    case 'Settlement Complete':
      return 'bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.75)]'
    default:
      return 'bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.75)]'
  }
}

const createEntry = (seed: number): FeedEntry => ({
  hash: randomHex(),
  id: `${Date.now()}-${seed}-${Math.random().toString(16).slice(2, 8)}`,
  pair: randomPair(),
  probability: randomProbability(),
  status: randomStatus(),
})

const initialEntries = () => Array.from({ length: 6 }, (_, index) => createEntry(index))

export function LiveIntentFeed() {
  const [entries, setEntries] = useState<FeedEntry[]>(() => initialEntries())
  const [processedCount, setProcessedCount] = useState(1248)

  useEffect(() => {
    let seed = 100

    const feedTimer = window.setInterval(() => {
      seed += 1
      setEntries((current) => [createEntry(seed), ...current].slice(0, 8))
    }, 2500)

    return () => window.clearInterval(feedTimer)
  }, [])

  useEffect(() => {
    const counterTimer = window.setInterval(() => {
      setProcessedCount((current) => current + Math.floor(Math.random() * 4) + 1)
    }, 3200)

    return () => window.clearInterval(counterTimer)
  }, [])

  const headerCount = useMemo(() => processedCount.toLocaleString(), [processedCount])

  return (
    <section className="relative w-full overflow-hidden rounded-[24px] border border-teal-400/12 bg-[#0d0d14] text-white shadow-[0_20px_90px_rgba(0,0,0,0.45)]">
      <style>{`
        @keyframes liveIntentSlideIn {
          from {
            opacity: 0;
            transform: translateY(-16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes liveIntentPulse {
          0%, 100% {
            opacity: 0.55;
            transform: scale(0.96);
          }
          50% {
            opacity: 1;
            transform: scale(1.08);
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_24%)]" />

      <div className="relative z-10 p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-3 border-b border-white/8 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-teal-100/55">ShadowSwap Network</p>
            <h2 className="mt-2 font-mono text-lg font-semibold tracking-tight text-white md:text-xl">
              Live Intent Feed — Encrypted
            </h2>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
              Simulated encrypted telemetry for interface presentation. Real onchain count appears in the launch terminal.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 font-mono text-xs text-emerald-100/90">
            <span
              className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.9)]"
              style={{ animation: 'liveIntentPulse 1.4s ease-in-out infinite' }}
            />
            <span className="uppercase tracking-[0.24em]">Network Active — {headerCount} intents processed</span>
          </div>
        </div>

        <div className="grid grid-cols-[1.1fr_0.9fr_1fr_0.75fr_0.75fr] gap-3 px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.26em] text-white/40">
          <span>Hash</span>
          <span>Pair</span>
          <span>Status</span>
          <span>Match %</span>
          <span>Route</span>
        </div>

        <div className="space-y-2">
          {entries.map((entry) => (
            <article
              className="grid grid-cols-[1.1fr_0.9fr_1fr_0.75fr_0.75fr] items-center gap-3 rounded-2xl border border-white/7 bg-white/[0.03] px-3 py-3 font-mono text-xs text-white/88 backdrop-blur-sm"
              key={entry.id}
              style={{ animation: 'liveIntentSlideIn 340ms ease-out' }}
            >
              <span className="truncate tracking-[0.18em] text-teal-100/82">{entry.hash}</span>
              <span className="truncate text-white/78">{entry.pair}</span>
              <span className="inline-flex min-w-0 items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(entry.status)}`} />
                <span className="truncate">{entry.status}</span>
              </span>
              <span className="text-white/72">{entry.probability}%</span>
              <span className="text-teal-200/72">Confidential</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default LiveIntentFeed

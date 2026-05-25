import { useEffect, useMemo, useState } from 'react'

type TraditionalOrder = {
  id: string
  direction: 'BUY' | 'SELL'
  pair: string
  price: string
  size: string
  status: 'live' | 'exploited' | 'bot'
}

type EncryptedIntent = {
  id: string
  route: string
  blob: string
}

type CounterState = {
  leakLeft: number
  leakRight: number
}

const ORDER_POOL: Omit<TraditionalOrder, 'id' | 'status'>[] = [
  { pair: 'ETH/USDC', size: '185.40', price: '3,842.10', direction: 'BUY' },
  { pair: 'WBTC/USDC', size: '12.00', price: '108,442.80', direction: 'SELL' },
  { pair: 'SOL/USDC', size: '4,820', price: '182.42', direction: 'BUY' },
  { pair: 'ARB/USDC', size: '28,100', price: '1.64', direction: 'SELL' },
  { pair: 'LINK/USDC', size: '920', price: '27.81', direction: 'BUY' },
  { pair: 'PEPE/USDC', size: '8.4M', price: '0.0000178', direction: 'SELL' },
  { pair: 'ENA/USDC', size: '14,520', price: '1.12', direction: 'BUY' },
]

const ENCRYPTED_ROUTES = [
  'ETH <> USDC',
  'WBTC <> USDC',
  'SOL <> USDC',
  'ARB <> USDC',
  'LINK <> USDC',
  'ENA <> USDC',
  'PEPE <> USDC',
] as const

const STAGES = [
  'Intent Encrypted',
  'Broadcasting Privately',
  'Searching Confidential Liquidity',
] as const

const randomHexBlob = () =>
  `0x${Math.random().toString(16).slice(2, 6)}${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 10)}`

const initialBlobs = (): EncryptedIntent[] =>
  Array.from({ length: 6 }, (_, index) => ({
    id: `blob-${index}`,
    route: ENCRYPTED_ROUTES[index % ENCRYPTED_ROUTES.length],
    blob: randomHexBlob(),
  }))

export function IntentLeakVisualizer() {
  const [orders, setOrders] = useState<TraditionalOrder[]>([])
  const [blobOrders, setBlobOrders] = useState<EncryptedIntent[]>(() => initialBlobs())
  const [showMevAlert, setShowMevAlert] = useState(false)
  const [showFrontRun, setShowFrontRun] = useState(false)
  const [showMatchFound, setShowMatchFound] = useState(false)
  const [activeStage, setActiveStage] = useState(0)
  const [counters, setCounters] = useState<CounterState>({ leakLeft: 0, leakRight: 0 })

  useEffect(() => {
    let orderCursor = 0

    const feed = window.setInterval(() => {
      setOrders((current) => {
        const nextOrder = ORDER_POOL[orderCursor % ORDER_POOL.length]
        orderCursor += 1

        const incoming: TraditionalOrder = {
          ...nextOrder,
          id: `order-${orderCursor}`,
          status: 'live',
        }

        return [incoming, ...current].slice(0, 7)
      })
    }, 800)

    return () => window.clearInterval(feed)
  }, [])

  useEffect(() => {
    const mevTimer = window.setTimeout(() => setShowMevAlert(true), 3000)
    const frontRunTimer = window.setTimeout(() => {
      setShowFrontRun(true)
      setOrders((current) => {
        if (current.length === 0) {
          return current
        }

        const target = current[Math.min(2, current.length - 1)]
        const exploited = {
          ...target,
          status: 'exploited' as const,
        }
        const botOrder: TraditionalOrder = {
          id: `bot-${target.id}`,
          pair: target.pair,
          size: target.size,
          direction: target.direction,
          price:
            target.direction === 'BUY'
              ? (Number(target.price.replace(/,/g, '')) + 2.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : (Number(target.price.replace(/,/g, '')) - 2.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          status: 'bot',
        }

        return current.flatMap((order) => {
          if (order.id !== target.id) {
            return [order]
          }

          return [exploited, botOrder]
        })
      })
    }, 4300)

    const matchTimer = window.setTimeout(() => setShowMatchFound(true), 3000)

    return () => {
      window.clearTimeout(mevTimer)
      window.clearTimeout(frontRunTimer)
      window.clearTimeout(matchTimer)
    }
  }, [])

  useEffect(() => {
    const blobShuffle = window.setInterval(() => {
      setBlobOrders((current) =>
        current.map((entry, index) => ({
          ...entry,
          route: ENCRYPTED_ROUTES[(index + Math.floor(Math.random() * ENCRYPTED_ROUTES.length)) % ENCRYPTED_ROUTES.length],
          blob: randomHexBlob(),
        })),
      )
    }, 850)

    return () => window.clearInterval(blobShuffle)
  }, [])

  useEffect(() => {
    const stageTimer = window.setInterval(() => {
      setActiveStage((current) => (current + 1) % STAGES.length)
    }, 1400)

    return () => window.clearInterval(stageTimer)
  }, [])

  useEffect(() => {
    const counterTimer = window.setInterval(() => {
      setCounters((current) => ({
        leakLeft: Math.min(100, current.leakLeft + 4),
        leakRight: Math.min(0, current.leakRight),
      }))
    }, 45)

    return () => window.clearInterval(counterTimer)
  }, [])

  const renderedOrders = useMemo(() => {
    if (orders.length > 0) {
      return orders
    }

    return ORDER_POOL.slice(0, 4).map((order, index) => ({
      ...order,
      id: `seed-${index}`,
      status: 'live' as const,
    }))
  }, [orders])

  return (
    <section className="relative w-full overflow-hidden rounded-[32px] border border-white/10 bg-[#0a0a0f] text-white shadow-[0_40px_140px_rgba(0,0,0,0.65)]">
      <style>{`
        @keyframes shadowPulseDanger {
          0%, 100% { box-shadow: inset 0 0 0 1px rgba(248,113,113,0.12), inset 0 0 80px rgba(220,38,38,0.10); }
          50% { box-shadow: inset 0 0 0 1px rgba(251,146,60,0.2), inset 0 0 120px rgba(239,68,68,0.18); }
        }
        @keyframes shadowPulsePrivate {
          0%, 100% { box-shadow: inset 0 0 0 1px rgba(45,212,191,0.12), inset 0 0 90px rgba(13,148,136,0.12); }
          50% { box-shadow: inset 0 0 0 1px rgba(94,234,212,0.2), inset 0 0 130px rgba(91,33,182,0.18); }
        }
        @keyframes scanLine {
          0% { transform: translateY(-100%); opacity: 0; }
          20% { opacity: 0.45; }
          100% { transform: translateY(420px); opacity: 0; }
        }
        @keyframes warningFlash {
          0%, 100% { opacity: 1; filter: saturate(1); }
          50% { opacity: 0.3; filter: saturate(1.9); }
        }
        @keyframes arcPulse {
          0%, 100% { opacity: 0.45; transform: scaleX(0.98); }
          50% { opacity: 1; transform: scaleX(1.02); }
        }
        @keyframes tickerIn {
          from { transform: translateY(14px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.06),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_30%)]" />

      <div className="grid min-h-[760px] w-full grid-cols-1 xl:grid-cols-[1fr_auto_1fr]">
        <div
          className="relative overflow-hidden border-b border-white/8 p-6 xl:border-b-0 xl:border-r xl:border-white/8 xl:p-8"
          style={{ animation: 'shadowPulseDanger 4s ease-in-out infinite' }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.14),transparent_36%),linear-gradient(180deg,rgba(153,27,27,0.16),transparent_60%)]" />
          <div className="pointer-events-none absolute left-0 top-0 h-24 w-full bg-gradient-to-b from-red-300/10 to-transparent" style={{ animation: 'scanLine 5.2s linear infinite' }} />

          <div className="relative z-10 flex h-full flex-col">
            <div className="mb-6 flex items-end justify-between gap-4 border-b border-red-400/15 pb-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.34em] text-red-200/60">Traditional DEX</p>
                <h2 className="mt-2 font-mono text-2xl font-semibold tracking-tight text-white">Visible Intent Surface</h2>
              </div>
              <div className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-red-200/70">
                exposed flow
              </div>
            </div>

            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-red-100/38">
              Scenario replay for judge walkthrough. Not live orderflow.
            </p>

            <div className="mb-4 grid grid-cols-[1.1fr_0.75fr_0.75fr_0.7fr] gap-3 px-3 text-[10px] uppercase tracking-[0.28em] text-red-100/45">
              <span>Pair</span>
              <span>Size</span>
              <span>Price</span>
              <span>Side</span>
            </div>

            <div className="relative flex-1 space-y-3">
              {showMevAlert ? (
                <div
                  className="rounded-2xl border border-orange-400/45 bg-gradient-to-r from-red-500/25 to-orange-400/20 px-4 py-3 font-mono text-sm font-semibold uppercase tracking-[0.3em] text-orange-100 shadow-[0_0_40px_rgba(251,146,60,0.18)]"
                  style={{ animation: 'warningFlash 0.9s linear infinite' }}
                >
                  ⚡ MEV BOT DETECTED
                </div>
              ) : null}

              <div className="space-y-3">
                {renderedOrders.map((order) => (
                  <article
                    className={`grid grid-cols-[1.1fr_0.75fr_0.75fr_0.7fr] gap-3 rounded-2xl border px-3 py-3 font-mono text-sm backdrop-blur-sm ${
                      order.status === 'bot'
                        ? 'border-orange-300/60 bg-orange-300/12 text-orange-50 shadow-[0_0_36px_rgba(251,146,60,0.22)]'
                        : order.status === 'exploited'
                          ? 'border-red-300/35 bg-red-950/40 text-red-100/50 line-through'
                          : 'border-white/8 bg-white/[0.03] text-white/90'
                    }`}
                    key={order.id}
                    style={{ animation: 'tickerIn 420ms ease-out' }}
                  >
                    <div className="flex flex-col">
                      <span>{order.pair}</span>
                      {order.status === 'bot' ? (
                        <span className="mt-1 text-[10px] uppercase tracking-[0.24em] text-orange-200/70">bot inserted</span>
                      ) : order.status === 'exploited' ? (
                        <span className="mt-1 text-[10px] uppercase tracking-[0.24em] text-red-200/70">frontrun target</span>
                      ) : null}
                    </div>
                    <span>{order.size}</span>
                    <span>{order.price}</span>
                    <span className={order.direction === 'BUY' ? 'text-emerald-300' : 'text-red-300'}>{order.direction}</span>
                  </article>
                ))}
              </div>

              <div className="grid gap-3 pt-4 md:grid-cols-2">
                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-red-100/50">Signal</p>
                  <strong className="mt-2 block font-mono text-lg text-red-50">{showFrontRun ? 'Intent Leaked' : 'Broadcasting...'}</strong>
                </div>
                <div className="rounded-2xl border border-orange-300/20 bg-orange-300/10 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-orange-100/50">Outcome</p>
                  <strong className="mt-2 block font-mono text-lg text-orange-50">
                    {showFrontRun ? 'Order Exploited' : 'Awaiting execution'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center border-b border-white/8 px-6 py-5 xl:border-b-0 xl:px-4">
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          <div className="relative rounded-full border border-white/15 bg-white/5 px-4 py-3 font-mono text-sm uppercase tracking-[0.36em] text-white/65 backdrop-blur-xl">
            vs
          </div>
        </div>

        <div
          className="relative overflow-hidden p-6 xl:p-8"
          style={{ animation: 'shadowPulsePrivate 4.6s ease-in-out infinite' }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.14),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(91,33,182,0.16),transparent_40%)]" />
          <div className="pointer-events-none absolute right-0 top-0 h-24 w-full bg-gradient-to-b from-teal-300/10 to-transparent" style={{ animation: 'scanLine 5.6s linear infinite' }} />

          <div className="relative z-10 flex h-full flex-col">
            <div className="mb-6 flex items-end justify-between gap-4 border-b border-teal-300/15 pb-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.34em] text-teal-100/60">ShadowSwap</p>
                <h2 className="mt-2 font-mono text-2xl font-semibold tracking-tight text-white">Encrypted Intent Router</h2>
              </div>
              <div className="rounded-full border border-teal-300/20 bg-teal-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-teal-100/75">
                confidential flow
              </div>
            </div>

            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-teal-100/38">
              Scenario replay of the privacy model. Live submission happens in the launch terminal.
            </p>

            <div className="mb-5 grid gap-2 md:grid-cols-3">
              {STAGES.map((stage, index) => (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm transition-all ${
                    activeStage === index
                      ? 'border-teal-300/45 bg-teal-300/10 text-teal-50 shadow-[0_0_28px_rgba(45,212,191,0.18)]'
                      : 'border-white/8 bg-white/[0.03] text-white/55'
                  }`}
                  key={stage}
                >
                  <span className="font-mono uppercase tracking-[0.2em]">{stage}</span>
                </div>
              ))}
            </div>

            <div className="relative flex-1">
              <div className="space-y-3">
                {blobOrders.map((entry, index) => (
                  <article
                    className={`grid grid-cols-[0.8fr_1.2fr] gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 font-mono text-sm text-white/90 backdrop-blur-sm ${
                      showMatchFound && (index === 1 || index === 4) ? 'border-teal-300/55 bg-teal-300/10 shadow-[0_0_36px_rgba(45,212,191,0.18)]' : ''
                    }`}
                    key={entry.id}
                    style={{ animation: 'tickerIn 420ms ease-out' }}
                  >
                    <span className="text-teal-100/55">{entry.route}</span>
                    <span className="tracking-[0.14em] text-violet-100/80">{entry.blob}</span>
                  </article>
                ))}
              </div>

              {showMatchFound ? (
                <div className="pointer-events-none absolute inset-x-10 top-[36%] hidden h-28 items-center justify-center xl:flex">
                  <div
                    className="h-full w-full rounded-full border-t border-teal-300/65 bg-transparent"
                    style={{ animation: 'arcPulse 1.8s ease-in-out infinite' }}
                  />
                  <div className="absolute rounded-full border border-teal-200/40 bg-teal-300/12 px-4 py-2 font-mono text-xs uppercase tracking-[0.34em] text-teal-50 shadow-[0_0_40px_rgba(45,212,191,0.22)]">
                    Match Found
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 pt-6 md:grid-cols-2">
                <div className="rounded-2xl border border-teal-300/20 bg-teal-300/10 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-teal-100/50">Visibility</p>
                  <strong className="mt-2 block font-mono text-lg text-teal-50">Settlement Only</strong>
                </div>
                <div className="rounded-2xl border border-violet-300/20 bg-violet-300/10 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-violet-100/50">Leakage</p>
                  <strong className="mt-2 block font-mono text-lg text-violet-50">Nothing Leaked</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-white/8 bg-white/[0.02] px-5 py-5 xl:px-8">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">MEV Exposure</p>
            <strong className="mt-2 block font-mono text-lg text-white">{counters.leakLeft}% <span className="text-red-300/70">vs</span> {counters.leakRight}%</strong>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">Intent Visibility</p>
            <strong className="mt-2 block font-mono text-lg text-white">Public <span className="text-white/35">vs</span> Encrypted</strong>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">Frontrun Risk</p>
            <strong className="mt-2 block font-mono text-lg text-white">High <span className="text-white/35">vs</span> None</strong>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">Order Leakage</p>
            <strong className="mt-2 block font-mono text-lg text-white">Full <span className="text-white/35">vs</span> Minimal</strong>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">Pre-trade Privacy</p>
            <strong className="mt-2 block font-mono text-lg text-white">No <span className="text-white/35">vs</span> Yes</strong>
          </div>
        </div>
      </div>
    </section>
  )
}

export default IntentLeakVisualizer

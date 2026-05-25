import { useEffect, useState } from 'react'
import IntentLeakVisualizer from './components/IntentLeakVisualizer'
import LiveIntentFeed from './components/LiveIntentFeed'
import ShadowSwapApp from './components/ShadowSwapApp'

type HeroCounters = {
  mevBillions: number
  leakPercent: number
  bytesRevealed: number
}

const STEPS = [
  {
    description: 'User submits trade, encrypted immediately,\nnever touches mempool',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24">
        <rect height="14" rx="3" stroke="currentColor" strokeWidth="1.5" width="16" x="4" y="7" />
        <path d="M8 7V5a4 4 0 1 1 8 0v2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        <circle cx="12" cy="14" fill="currentColor" r="1.4" />
      </svg>
    ),
    title: 'Encrypt Intent',
  },
  {
    description: 'Protocol searches for matching liquidity\nWITHOUT revealing your intent',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="m15.5 15.5 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        <path d="M11 8.5v5M8.5 11H13.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    ),
    title: 'Blind Discovery',
  },
  {
    description: 'Computation on encrypted intents,\nmatch found before any revelation',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path d="M5 8h5l2-3 2 3h5v8h-5l-2 3-2-3H5z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="M9 12h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    ),
    title: 'FHE Matching',
  },
  {
    description: 'Only execution result revealed,\nnothing else',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path d="M6 12.5 10 16l8-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <rect height="16" rx="4" stroke="currentColor" strokeWidth="1.5" width="18" x="3" y="4" />
      </svg>
    ),
    title: 'Minimal Settlement',
  },
] as const

const ARCHITECTURE_NODES = [
  { icon: 'U', label: 'User', x: 70 },
  { icon: 'E', label: 'Intent Encryption', x: 290 },
  { icon: 'F', label: 'FHE Matching Engine', x: 550 },
  { icon: 'P', label: 'Proof Verification', x: 830 },
  { icon: 'S', label: 'Settlement', x: 1070 },
] as const

function App() {
  const [heroCounters, setHeroCounters] = useState<HeroCounters>({
    bytesRevealed: 18,
    leakPercent: 0,
    mevBillions: 0,
  })

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroCounters((current) => {
        const next = {
          bytesRevealed: Math.max(0, current.bytesRevealed - 1),
          leakPercent: Math.min(100, current.leakPercent + 4),
          mevBillions: Math.min(1.4, Number((current.mevBillions + 0.06).toFixed(2))),
        }

        if (next.bytesRevealed === 0 && next.leakPercent === 100 && next.mevBillions === 1.4) {
          window.clearInterval(timer)
        }

        return next
      })
    }, 42)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0f] font-['Inter',system-ui,sans-serif] text-white">
      <style>{`
        @keyframes heroGridPulse {
          0%, 100% { opacity: 0.28; transform: scale(1); }
          50% { opacity: 0.52; transform: scale(1.015); }
        }
        @keyframes lineDrift {
          0% { transform: translateX(0); opacity: 0.15; }
          50% { opacity: 0.4; }
          100% { transform: translateX(24px); opacity: 0.15; }
        }
        @keyframes floatUp {
          0% { transform: translateY(0); opacity: 0; }
          12% { opacity: 0.5; }
          100% { transform: translateY(-140px); opacity: 0; }
        }
        @keyframes glowDash {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -24; }
        }
        @keyframes boxGlow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(0,212,170,0.10), 0 0 30px rgba(0,212,170,0.06); }
          50% { box-shadow: 0 0 0 1px rgba(0,212,170,0.22), 0 0 46px rgba(0,212,170,0.13); }
        }
      `}</style>

      <main className="overflow-x-hidden">
        <section className="relative flex min-h-screen items-center overflow-hidden px-6 py-14 md:px-10 xl:px-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,212,170,0.16),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(8,145,178,0.14),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_30%)]" />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,212,170,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,170,0.08)_1px,transparent_1px)] bg-[size:62px_62px]"
            style={{ animation: 'heroGridPulse 5.4s ease-in-out infinite' }}
          />
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <span className="absolute left-[12%] top-[72%] h-2 w-2 rounded-full bg-teal-300/60" style={{ animation: 'floatUp 9s linear infinite' }} />
            <span className="absolute left-[26%] top-[80%] h-1.5 w-1.5 rounded-full bg-cyan-300/65" style={{ animation: 'floatUp 11s linear infinite 1s' }} />
            <span className="absolute left-[58%] top-[75%] h-2 w-2 rounded-full bg-teal-200/55" style={{ animation: 'floatUp 10s linear infinite 2s' }} />
            <span className="absolute left-[74%] top-[82%] h-1.5 w-1.5 rounded-full bg-emerald-300/60" style={{ animation: 'floatUp 8.5s linear infinite 0.5s' }} />
            <span className="absolute left-[88%] top-[70%] h-2 w-2 rounded-full bg-cyan-200/55" style={{ animation: 'floatUp 12s linear infinite 1.6s' }} />
            <div className="absolute left-[10%] top-[22%] h-px w-36 bg-gradient-to-r from-transparent via-teal-300/40 to-transparent" style={{ animation: 'lineDrift 6s ease-in-out infinite' }} />
            <div className="absolute left-[45%] top-[35%] h-px w-44 bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" style={{ animation: 'lineDrift 8s ease-in-out infinite' }} />
            <div className="absolute left-[68%] top-[58%] h-px w-28 bg-gradient-to-r from-transparent via-teal-200/35 to-transparent" style={{ animation: 'lineDrift 5.5s ease-in-out infinite' }} />
          </div>

          <div className="relative z-10 mx-auto grid w-full max-w-[1440px] gap-12 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] xl:items-center">
            <div className="max-w-4xl">
              <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-teal-400/15 bg-white/[0.03] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.34em] text-teal-100/70 backdrop-blur-xl">
                <span className="h-2.5 w-2.5 rounded-full bg-[#00d4aa] shadow-[0_0_16px_rgba(0,212,170,0.85)]" />
                encrypted market intelligence
              </div>

              <h1 className="max-w-5xl text-5xl font-semibold leading-[0.96] tracking-[-0.06em] text-white md:text-7xl xl:text-[5.9rem]">
                Private Price Discovery for Onchain Markets
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-white/66 md:text-xl">
                Blind intent matching powered by encrypted computation. Markets coordinate before information leaks.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <a
                  className="inline-flex items-center justify-center rounded-2xl bg-[#00d4aa] px-7 py-4 text-sm font-semibold tracking-[0.18em] text-[#041512] transition-transform duration-200 hover:-translate-y-0.5"
                  href="#launch"
                >
                  Launch App
                </a>
                <a
                  className="inline-flex items-center justify-center rounded-2xl border border-white/14 bg-white/[0.03] px-7 py-4 text-sm font-semibold tracking-[0.18em] text-white transition-transform duration-200 hover:-translate-y-0.5"
                  href="#architecture"
                >
                  View Architecture
                </a>
              </div>

              <div className="mt-12 grid gap-4 md:grid-cols-3">
                <article className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 backdrop-blur-xl">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/45">MEV Drain</p>
                  <strong className="mt-3 block text-3xl font-semibold tracking-[-0.04em] text-white">
                    ${heroCounters.mevBillions.toFixed(1)}B+
                  </strong>
                  <span className="mt-2 block text-sm text-white/58">MEV extracted annually</span>
                </article>
                <article className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 backdrop-blur-xl">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/45">Intent Leakage</p>
                  <strong className="mt-3 block text-3xl font-semibold tracking-[-0.04em] text-white">
                    {heroCounters.leakPercent}%
                  </strong>
                  <span className="mt-2 block text-sm text-white/58">of traditional orders leak intent</span>
                </article>
                <article className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 backdrop-blur-xl">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/45">Revealed Data</p>
                  <strong className="mt-3 block text-3xl font-semibold tracking-[-0.04em] text-white">
                    {heroCounters.bytesRevealed}
                  </strong>
                  <span className="mt-2 block text-sm text-white/58">bytes of intent revealed on ShadowSwap</span>
                </article>
              </div>

              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.24em] text-white/42">
                Animated benchmark counters for presentation. Live contract activity appears in the launch terminal below.
              </p>
            </div>

            <div className="relative">
              <div className="rounded-[30px] border border-teal-400/12 bg-[#0c1115]/90 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between border-b border-white/8 pb-4">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-teal-100/55">ShadowSwap Terminal</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Encrypted Market Surface</h2>
                  </div>
                  <div className="rounded-full border border-teal-400/15 bg-teal-400/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-teal-100/70">
                    illustrative preview
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-2xl border border-white/7 bg-white/[0.03] p-4">
                    <div className="mb-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.24em] text-white/42">
                      <span>Intent Stream</span>
                      <span>Confidential</span>
                    </div>
                    <div className="space-y-2 font-mono text-sm text-teal-100/80">
                      <div className="flex justify-between rounded-xl bg-teal-400/[0.08] px-3 py-2">
                        <span>0x9af1c2e4...77d1</span>
                        <span>Encrypted</span>
                      </div>
                      <div className="flex justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-violet-100/75">
                        <span>0x2bc8aa10...1e3c</span>
                        <span>Matching</span>
                      </div>
                      <div className="flex justify-between rounded-xl bg-white/[0.04] px-3 py-2">
                        <span>0xfd18e0c9...44af</span>
                        <span>Sealed</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/7 bg-white/[0.03] p-4">
                      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/42">Discovery Layer</p>
                      <strong className="mt-3 block text-lg text-white">Matching before revelation</strong>
                      <span className="mt-2 block text-sm text-white/55">Liquidity coordination happens without broadcasting visible order intent.</span>
                    </div>
                    <div className="rounded-2xl border border-white/7 bg-white/[0.03] p-4">
                      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/42">Settlement Layer</p>
                      <strong className="mt-3 block text-lg text-white">Reveal execution only</strong>
                      <span className="mt-2 block text-sm text-white/55">Only the final outcome becomes visible. Side, size, and route stay sealed.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-8 md:px-10 xl:px-16" id="launch">
          <div className="mx-auto max-w-[1440px]">
            <ShadowSwapApp />
          </div>
        </section>

        <section className="px-6 py-12 md:px-10 xl:px-16">
          <div className="mx-auto max-w-[1440px]">
            <IntentLeakVisualizer />
          </div>
        </section>

        <section className="px-6 py-16 md:px-10 xl:px-16">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-10 max-w-3xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-teal-100/58">How It Works</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">Encrypted coordination without pre-trade leakage</h2>
            </div>

            <div className="grid gap-5 xl:grid-cols-4">
              {STEPS.map((step, index) => (
                <article
                  className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl"
                  key={step.title}
                  style={{ animation: 'boxGlow 5.6s ease-in-out infinite' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-2xl border border-teal-400/18 bg-teal-400/10 p-3 text-[#00d4aa]">{step.icon}</div>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] text-white/52">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-white">{step.title}</h3>
                  <p className="mt-3 whitespace-pre-line text-base leading-7 text-white/60">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:px-10 xl:px-16" id="architecture">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-10 max-w-3xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-teal-100/58">Architecture Diagram</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">Intent flow through encrypted market infrastructure</h2>
            </div>

            <div className="overflow-hidden rounded-[30px] border border-white/8 bg-[#0d1118] p-4 md:p-8">
              <div className="overflow-x-auto">
                <svg className="min-w-[1160px]" fill="none" viewBox="0 0 1160 260">
                  <defs>
                    <linearGradient id="shadowSwapArrow" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
                      <stop offset="100%" stopColor="#00d4aa" />
                    </linearGradient>
                  </defs>

                  {ARCHITECTURE_NODES.slice(0, -1).map((node, index) => (
                    <g key={`${node.label}-arrow`}>
                      <path
                        d={`M ${node.x + 120} 130 L ${ARCHITECTURE_NODES[index + 1].x - 20} 130`}
                        stroke="url(#shadowSwapArrow)"
                        strokeDasharray="8 8"
                        strokeWidth="2"
                        style={{ animation: 'glowDash 1.4s linear infinite' }}
                      />
                      <path
                        d={`M ${ARCHITECTURE_NODES[index + 1].x - 28} 124 L ${ARCHITECTURE_NODES[index + 1].x - 20} 130 L ${ARCHITECTURE_NODES[index + 1].x - 28} 136`}
                        stroke="#00d4aa"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </g>
                  ))}

                  {ARCHITECTURE_NODES.map((node) => (
                    <g key={node.label}>
                      <rect
                        fill="rgba(255,255,255,0.03)"
                        height="92"
                        rx="20"
                        stroke="rgba(255,255,255,0.08)"
                        width="140"
                        x={node.x}
                        y="84"
                      />
                      <circle cx={node.x + 30} cy="114" fill="rgba(0,212,170,0.14)" r="18" stroke="rgba(0,212,170,0.28)" />
                      <text
                        fill="#8ef0d8"
                        fontFamily="ui-monospace, SFMono-Regular, monospace"
                        fontSize="14"
                        fontWeight="700"
                        textAnchor="middle"
                        x={node.x + 30}
                        y="119"
                      >
                        {node.icon}
                      </text>
                      <text
                        fill="#ffffff"
                        fontFamily="Inter, system-ui, sans-serif"
                        fontSize="14"
                        fontWeight="600"
                        x={node.x + 56}
                        y="112"
                      >
                        {node.label}
                      </text>
                      <text
                        fill="rgba(255,255,255,0.48)"
                        fontFamily="ui-monospace, SFMono-Regular, monospace"
                        fontSize="10"
                        letterSpacing="2"
                        x={node.x + 56}
                        y="132"
                      >
                        ENCRYPTED FLOW
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:px-10 xl:px-16">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-10 max-w-3xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-teal-100/58">Comparison</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">Public orderflow versus encrypted coordination</h2>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-white/8 bg-white/[0.03]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/8 bg-white/[0.02] text-left font-mono text-[11px] uppercase tracking-[0.28em] text-white/48">
                    <th className="px-5 py-4 font-medium">Feature</th>
                    <th className="px-5 py-4 font-medium">Traditional DEX</th>
                    <th className="px-5 py-4 font-medium">ShadowSwap</th>
                  </tr>
                </thead>
                <tbody className="text-sm md:text-base">
                  {[
                    ['Public Orders', 'Yes ❌', 'No ✅'],
                    ['Intent Leakage', 'High ❌', 'Minimal ✅'],
                    ['Visible Orderbook', 'Yes ❌', 'Hidden ✅'],
                    ['MEV Exposure', 'Full ❌', 'None ✅'],
                    ['Pre-Trade Privacy', 'No ❌', 'Yes ✅'],
                    ['Blind Matching', 'No ❌', 'Yes ✅'],
                  ].map(([feature, traditional, shadow]) => (
                    <tr className="border-b border-white/6 last:border-b-0" key={feature}>
                      <td className="px-5 py-4 text-white/90">{feature}</td>
                      <td className="px-5 py-4 text-red-100/78">{traditional}</td>
                      <td className="px-5 py-4 text-teal-100/85">{shadow}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:px-10 xl:px-16" id="live-feed">
          <div className="mx-auto max-w-[1440px]">
            <LiveIntentFeed />
          </div>
        </section>
      </main>

      <footer className="border-t border-white/8 px-6 py-8 md:px-10 xl:px-16">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold tracking-[-0.03em] text-white">ShadowSwap — Blind Intent Matching Protocol</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.28em] text-teal-100/58">Built on Fhenix FHE</p>
          </div>
          <div className="flex flex-wrap items-center gap-5 font-mono text-[11px] uppercase tracking-[0.28em] text-white/56">
            <a className="transition-colors hover:text-white" href="https://github.com" rel="noreferrer" target="_blank">
              GitHub
            </a>
            <a className="transition-colors hover:text-white" href="#architecture">
              Architecture
            </a>
            <a className="transition-colors hover:text-white" href="#launch">
              Demo
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

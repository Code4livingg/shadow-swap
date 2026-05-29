import { Link } from 'react-router-dom'

// ── Data ─────────────────────────────────────────────────────────────────────

const ARCHITECTURE_NODES = [
  { icon: 'U', label: 'User', x: 70 },
  { icon: 'E', label: 'Intent Encryption', x: 290 },
  { icon: 'F', label: 'FHE Matching Engine', x: 550 },
  { icon: 'P', label: 'Proof Verification', x: 830 },
  { icon: 'S', label: 'Settlement', x: 1070 },
] as const

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

// ── Component ─────────────────────────────────────────────────────────────────

export function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] font-['Inter',system-ui,sans-serif] text-white">
      <style>{`
        @keyframes glowDash {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -24; }
        }
        @keyframes boxGlow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(0,212,170,0.10), 0 0 30px rgba(0,212,170,0.06); }
          50% { box-shadow: 0 0 0 1px rgba(0,212,170,0.22), 0 0 46px rgba(0,212,170,0.13); }
        }
      `}</style>

      <main className="overflow-x-hidden pt-16">
        {/* ── Page header ── */}
        <section className="relative overflow-hidden px-6 py-14 md:px-10 xl:px-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,212,170,0.10),transparent_30%)]" />
          <div className="relative z-10 mx-auto max-w-[1440px]">
            <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-teal-400/15 bg-white/[0.03] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.34em] text-teal-100/70 backdrop-blur-xl">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#00d4aa] shadow-[0_0_12px_rgba(0,212,170,0.85)]" />
              System Architecture
            </div>
            <h1 className="text-5xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
              Intent flow through encrypted market infrastructure
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/60">
              Every component in the ShadowSwap stack is designed to coordinate markets without leaking pre-trade information.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center rounded-2xl bg-[#00d4aa] px-7 py-4 text-sm font-semibold tracking-[0.18em] text-[#041512] no-underline transition-transform duration-200 hover:-translate-y-0.5"
                to="/app"
              >
                Launch App
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-2xl border border-teal-400/20 bg-teal-400/[0.06] px-7 py-4 text-sm font-semibold tracking-[0.18em] text-teal-100 no-underline transition-transform duration-200 hover:-translate-y-0.5"
                to="/demo"
              >
                View Demo
              </Link>
            </div>
          </div>
        </section>

        {/* ── Architecture diagram ── */}
        <section className="px-6 py-12 md:px-10 xl:px-16">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-10 max-w-3xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-teal-100/58">Architecture Diagram</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                End-to-end encrypted pipeline
              </h2>
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

        {/* ── Workflow steps ── */}
        <section className="px-6 py-16 md:px-10 xl:px-16">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-10 max-w-3xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-teal-100/58">Workflow</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                Four-step encrypted coordination
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {STEPS.map((step, index) => (
                <article
                  className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl"
                  key={step.title}
                  style={{ animation: 'boxGlow 5.6s ease-in-out infinite' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-2xl border border-teal-400/18 bg-teal-400/10 p-3 text-[#00d4aa]">
                      {step.icon}
                    </div>
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

        {/* ── Comparison table ── */}
        <section className="px-6 py-16 md:px-10 xl:px-16">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-10 max-w-3xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-teal-100/58">Comparison</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                Public orderflow versus encrypted coordination
              </h2>
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

        {/* ── Bottom CTAs ── */}
        <section className="px-6 py-16 md:px-10 xl:px-16">
          <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              className="inline-flex items-center justify-center rounded-2xl bg-[#00d4aa] px-7 py-4 text-sm font-semibold tracking-[0.18em] text-[#041512] no-underline transition-transform duration-200 hover:-translate-y-0.5"
              to="/app"
            >
              Launch App
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-2xl border border-teal-400/20 bg-teal-400/[0.06] px-7 py-4 text-sm font-semibold tracking-[0.18em] text-teal-100 no-underline transition-transform duration-200 hover:-translate-y-0.5"
              to="/demo"
            >
              View Demo
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-2xl border border-white/14 bg-white/[0.03] px-7 py-4 text-sm font-semibold tracking-[0.18em] text-white no-underline transition-transform duration-200 hover:-translate-y-0.5"
              to="/"
            >
              Back to Home
            </Link>
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
            <Link className="text-white/56 no-underline transition-colors hover:text-white" to="/">Home</Link>
            <Link className="text-white/56 no-underline transition-colors hover:text-white" to="/demo">Demo</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

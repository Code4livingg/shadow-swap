import { Link } from 'react-router-dom'
import ShadowSwapApp from '../components/ShadowSwapApp'

export function AppPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] font-['Inter',system-ui,sans-serif] text-white">
      <main className="overflow-x-hidden pt-16">
        {/* ── Page header ── */}
        <section className="relative overflow-hidden px-6 py-14 md:px-10 xl:px-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,212,170,0.08),transparent_30%)]" />
          <div className="relative z-10 mx-auto max-w-[1440px]">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-teal-400/15 bg-white/[0.03] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.34em] text-teal-100/70 backdrop-blur-xl">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#00d4aa] shadow-[0_0_12px_rgba(0,212,170,0.85)]" />
                  Live on Arbitrum Sepolia
                </div>
                <h1 className="text-5xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
                  ShadowSwap Terminal
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-white/60">
                  Submit blind intents to the live network. Encrypt trade parameters client-side. Monitor onchain intent state in real time.
                </p>
              </div>

              {/* Secondary CTAs — right-aligned on desktop */}
              <div className="flex shrink-0 flex-row gap-3 md:flex-col md:items-end">
                <Link
                  className="inline-flex items-center justify-center rounded-2xl border border-white/14 bg-white/[0.03] px-7 py-4 text-sm font-semibold tracking-[0.18em] text-white no-underline transition-transform duration-200 hover:-translate-y-0.5"
                  to="/architecture"
                >
                  View Architecture
                </Link>
                <Link
                  className="inline-flex items-center justify-center rounded-2xl border border-teal-400/20 bg-teal-400/[0.06] px-7 py-4 text-sm font-semibold tracking-[0.18em] text-teal-100 no-underline transition-transform duration-200 hover:-translate-y-0.5"
                  to="/demo"
                >
                  View Demo
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Terminal ── */}
        <section className="px-6 pb-20 pt-2 md:px-10 xl:px-16">
          <div className="mx-auto max-w-[1440px]">
            <ShadowSwapApp />
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
            <Link className="text-white/56 no-underline transition-colors hover:text-white" to="/architecture">
              Architecture
            </Link>
            <Link className="text-white/56 no-underline transition-colors hover:text-white" to="/demo">
              Demo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

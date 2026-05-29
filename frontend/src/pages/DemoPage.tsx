import { Link } from 'react-router-dom'
import IntentLeakVisualizer from '../components/IntentLeakVisualizer'
import LiveIntentFeed from '../components/LiveIntentFeed'

export function DemoPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] font-['Inter',system-ui,sans-serif] text-white">
      <main className="overflow-x-hidden pt-16">
        {/* ── Page header ── */}
        <section className="relative overflow-hidden px-6 py-14 md:px-10 xl:px-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,212,170,0.10),transparent_30%)]" />
          <div className="relative z-10 mx-auto max-w-[1440px]">
            <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-teal-400/15 bg-white/[0.03] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.34em] text-teal-100/70 backdrop-blur-xl">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#00d4aa] shadow-[0_0_12px_rgba(0,212,170,0.85)]" />
              Live Demo
            </div>
            <h1 className="text-5xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
              Intent privacy in action
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/60">
              Watch the difference between a traditional DEX leaking intent and ShadowSwap's encrypted coordination — side by side.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center rounded-2xl bg-[#00d4aa] px-7 py-4 text-sm font-semibold tracking-[0.18em] text-[#041512] no-underline transition-transform duration-200 hover:-translate-y-0.5"
                to="/app"
              >
                Launch App
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-2xl border border-white/14 bg-white/[0.03] px-7 py-4 text-sm font-semibold tracking-[0.18em] text-white no-underline transition-transform duration-200 hover:-translate-y-0.5"
                to="/architecture"
              >
                View Architecture
              </Link>
            </div>
          </div>
        </section>

        {/* ── Intent leak visualizer ── */}
        <section className="px-6 py-12 md:px-10 xl:px-16">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-10 max-w-3xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-teal-100/58">Comparison</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                Traditional DEX vs ShadowSwap
              </h2>
              <p className="mt-4 text-base leading-7 text-white/60">
                The left panel shows how a traditional DEX exposes intent to MEV bots. The right panel shows ShadowSwap's encrypted flow — only ciphertext blobs are visible until settlement.
              </p>
            </div>
            <IntentLeakVisualizer />
          </div>
        </section>

        {/* ── Live intent feed ── */}
        <section className="px-6 py-16 md:px-10 xl:px-16">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-10 max-w-3xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-teal-100/58">Network Activity</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                Encrypted intent feed
              </h2>
              <p className="mt-4 text-base leading-7 text-white/60">
                Simulated encrypted telemetry showing what the network surface looks like — hashes, status, and match probability, but never the underlying intent.
              </p>
            </div>
            <LiveIntentFeed />
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
              className="inline-flex items-center justify-center rounded-2xl border border-white/14 bg-white/[0.03] px-7 py-4 text-sm font-semibold tracking-[0.18em] text-white no-underline transition-transform duration-200 hover:-translate-y-0.5"
              to="/architecture"
            >
              View Architecture
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
            <Link className="text-white/56 no-underline transition-colors hover:text-white" to="/architecture">Architecture</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

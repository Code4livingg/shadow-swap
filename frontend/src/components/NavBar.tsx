import { Link, useLocation } from 'react-router-dom'

export function NavBar() {
  const { pathname } = useLocation()

  const links = [
    { to: '/', label: 'Home' },
    { to: '/app', label: 'App' },
    { to: '/architecture', label: 'Architecture' },
    { to: '/demo', label: 'Demo' },
  ]

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/8 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 md:px-10 xl:px-16">
        <Link className="flex items-center gap-3 text-white no-underline" to="/">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#00d4aa]/15 font-mono text-sm font-bold text-[#00d4aa]">
            S
          </span>
          <span className="font-semibold tracking-[-0.03em]">ShadowSwap</span>
        </Link>

        {/* Centre nav — hidden on small screens */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map(({ to, label }) => {
            const active = pathname === to
            return (
              <Link
                className={`rounded-xl px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] no-underline transition-colors ${
                  active ? 'bg-white/8 text-white' : 'text-white/55 hover:text-white'
                }`}
                key={to}
                to={to}
              >
                {label}
              </Link>
            )
          })}
        </div>

        <Link
          className="shrink-0 rounded-xl bg-[#00d4aa] px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#041512] no-underline transition-transform duration-200 hover:-translate-y-0.5"
          to="/app"
        >
          Launch App
        </Link>
      </div>
    </nav>
  )
}

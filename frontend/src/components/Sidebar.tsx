import { Menu, Shield, Signal, Sparkles, VenetianMask, WalletCards, X } from 'lucide-react'

export type AppPage = 'activity' | 'clubs' | 'lounge' | 'orderbook' | 'signals' | 'trade'

type SidebarProps = {
  activePage: AppPage
  onSelect: (page: AppPage) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const navItems: Array<{ icon: typeof Sparkles; id: AppPage; label: string }> = [
  { icon: Sparkles, id: 'lounge', label: 'The Lounge' },
  { icon: Shield, id: 'trade', label: 'Trade' },
  { icon: WalletCards, id: 'orderbook', label: 'Orderbook' },
  { icon: VenetianMask, id: 'clubs', label: 'Clubs' },
  { icon: Signal, id: 'signals', label: 'Signals' },
  { icon: Shield, id: 'activity', label: 'Activity' },
]

export function Sidebar({ activePage, onSelect, open, setOpen }: SidebarProps) {
  return (
    <>
      <button
        aria-label="Toggle navigation"
        className="sidebar-toggle"
        onClick={() => setOpen(!open)}
        type="button"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      <aside className={`sidebar glass-panel ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">S</div>
          <div>
            <p className="eyebrow">Members Only</p>
            <h2>ShadowSwap</h2>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <button
                className={`nav-item ${item.id === activePage ? 'active' : ''}`}
                key={item.id}
                onClick={() => {
                  onSelect(item.id)
                  setOpen(false)
                }}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <p>Private intelligence lounge</p>
          <span>Arbitrum Sepolia</span>
        </div>
      </aside>
    </>
  )
}

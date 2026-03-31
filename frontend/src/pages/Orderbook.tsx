import { MarketPanels } from '../components/MarketPanels'
import type { OrderbookRow, ShadowSwapSnapshot } from '../contracts/ShadowSwap'
import type { TransactionState } from '../hooks/useShadowSwap'

type OrderbookProps = {
  onMatchOrders: () => Promise<string | void>
  onRefresh: () => Promise<void>
  onRevealWinner: () => Promise<string | void>
  orderbook: OrderbookRow[]
  refreshing: boolean
  snapshot: ShadowSwapSnapshot
  transaction: TransactionState
  working: boolean
}

export function Orderbook(props: OrderbookProps) {
  return (
    <section className="page-stack">
      <MarketPanels {...props} />
    </section>
  )
}

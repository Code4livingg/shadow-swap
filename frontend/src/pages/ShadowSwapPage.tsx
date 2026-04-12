import { useState } from 'react'
import { Header } from '../components/Header'
import { Sidebar, type AppPage } from '../components/Sidebar'
import { ToastStack } from '../components/ToastStack'
import { useBlindIntent } from '../hooks/useBlindIntent'
import { useClubs } from '../hooks/useClubs'
import { useShadowSwap } from '../hooks/useShadowSwap'
import { useSignals } from '../hooks/useSignals'
import { Activity } from './Activity'
import { Clubs } from './Clubs'
import { Lounge } from './Lounge'
import { Orderbook } from './Orderbook'
import { Signals } from './Signals'
import { Trade } from './Trade'

export function ShadowSwapPage() {
  const shadowSwap = useShadowSwap()
  const blindIntent = useBlindIntent()
  const clubs = useClubs()
  const signals = useSignals()
  const [activePage, setActivePage] = useState<AppPage>('lounge')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const working =
    shadowSwap.submitting || shadowSwap.matching || shadowSwap.revealing || shadowSwap.refreshing

  const pageProps = {
    activity: (
      <Activity
        contractAddress={shadowSwap.contractAddress}
        deploymentPending={shadowSwap.deploymentPending}
        history={shadowSwap.history}
      />
    ),
    clubs: (
      <Clubs
        clubs={clubs.clubs}
        createClub={clubs.createClub}
        joinedClubIds={clubs.joinedClubIds}
        joiningClubId={clubs.joiningClubId}
        joinClub={clubs.joinClub}
        yourClub={clubs.yourClub}
      />
    ),
    lounge: (
      <Lounge
        activeClubs={clubs.clubs.length}
        encryptedTrades={shadowSwap.userTradeCount}
        fheOperationsToday={shadowSwap.fheOperationsToday}
        isConnected={shadowSwap.isConnected}
        recentActivity={shadowSwap.recentEncryptedActivity}
        totalEncryptedOrders={shadowSwap.snapshot.orderCount}
      />
    ),
    orderbook: (
      <Orderbook
        onMatchOrders={shadowSwap.runMatchOrders}
        onRefresh={shadowSwap.refresh}
        onRevealWinner={shadowSwap.runRevealWinner}
        orderbook={shadowSwap.orderbook}
        refreshing={shadowSwap.refreshing}
        snapshot={shadowSwap.snapshot}
        transaction={shadowSwap.transaction}
        working={!shadowSwap.isConnected || shadowSwap.networkMismatch || shadowSwap.deploymentPending || working}
      />
    ),
    signals: (
      <Signals
        decryptSignal={signals.decryptSignal}
        decryptingId={signals.decryptingId}
        filter={signals.filter}
        revealedIds={signals.revealedIds}
        setFilter={signals.setFilter}
        signals={signals.signals}
        typedText={signals.typedText}
      />
    ),
    trade: (
      <Trade
        blindSubmitting={blindIntent.submittingBlindIntent}
        deploymentPending={shadowSwap.deploymentPending}
        disabled={!shadowSwap.isConnected || shadowSwap.networkMismatch || working || blindIntent.submittingBlindIntent}
        onSubmitBlind={async ({ amount, slippage, tokenA, tokenB }) =>
          blindIntent.submitBlindIntent({
            amount,
            slippage: Number(slippage),
            timestamp: Date.now(),
            tokenIn: tokenA,
            tokenOut: tokenB,
          })
        }
        onSubmit={shadowSwap.submitOrder}
        submitting={shadowSwap.submitting}
      />
    ),
  } as const

  return (
    <main className="app-layout">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />
      <ToastStack toasts={shadowSwap.toasts} />

      <Sidebar
        activePage={activePage}
        onSelect={setActivePage}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div className="main-column">
        <Header
          address={shadowSwap.address}
          isConnected={shadowSwap.isConnected}
          networkLabel={shadowSwap.headerNetworkLabel}
          networkMismatch={shadowSwap.networkMismatch}
          orderCount={shadowSwap.snapshot.orderCount}
        />

        <section className="page-shell">{pageProps[activePage]}</section>
      </div>
    </main>
  )
}

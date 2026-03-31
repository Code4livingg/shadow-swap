import { TransactionHistory } from '../components/TransactionHistory'
import type { TransactionEntry } from '../hooks/useShadowSwap'

type ActivityProps = {
  contractAddress: string
  deploymentPending: boolean
  history: TransactionEntry[]
}

export function Activity({ contractAddress, deploymentPending, history }: ActivityProps) {
  return (
    <section className="page-stack">
      <TransactionHistory
        contractAddress={contractAddress}
        deploymentPending={deploymentPending}
        history={history}
      />
    </section>
  )
}

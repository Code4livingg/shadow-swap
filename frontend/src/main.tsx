import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { arbitrumSepolia } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'
import './index.css'
import App from './App.tsx'

const rpcUrl = import.meta.env.VITE_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'
const walletConnectProjectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'shadow-swap-walletconnect-placeholder'

const config = createConfig({
  chains: [arbitrumSepolia],
  connectors: [
    metaMask({
      dappMetadata: {
        iconUrl: 'https://shadowswap.xyz/icon.png',
        name: 'ShadowSwap',
        url: 'https://shadowswap.xyz',
      },
    }),
    walletConnect({
      metadata: {
        description: 'Confidential orderbook frontend for ShadowSwap.',
        icons: ['https://shadowswap.xyz/icon.png'],
        name: 'ShadowSwap',
        url: 'https://shadowswap.xyz',
      },
      projectId: walletConnectProjectId,
      showQrModal: true,
    }),
    injected(),
  ],
  transports: {
    [arbitrumSepolia.id]: http(rpcUrl),
  },
})

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)

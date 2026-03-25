import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http, injected } from 'wagmi'
import { arbitrumSepolia } from 'wagmi/chains'
import './index.css'
import App from './App.tsx'

const rpcUrl = import.meta.env.VITE_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'

const config = createConfig({
  chains: [arbitrumSepolia],
  connectors: [injected()],
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

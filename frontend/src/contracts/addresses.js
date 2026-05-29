// Deployed contract addresses on Arbitrum Sepolia
export const CONTRACT_ADDRESSES = {
  shadowIntent: '0x1B60D7b33deEA9345d0Df73316a97677b7D8b193',
  shadowMatcher: '0x1143fc8cC33316aA3E6F7CfC9E2b792461E6E9DD',
  shadowSettlement: '0x80706cB2b54f5E584E7C7ebE618bB76c4E1c3b48',
}

// Arbitrum Sepolia chain configuration
export const ARBITRUM_SEPOLIA = {
  chainId: 421614,
  chainIdHex: '0x66eee',
  chainName: 'Arbitrum Sepolia',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
  blockExplorerUrls: ['https://sepolia.arbiscan.io'],
}

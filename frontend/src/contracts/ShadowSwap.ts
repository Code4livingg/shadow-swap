import { BrowserProvider, Contract, JsonRpcProvider, ZeroAddress, isAddress } from 'ethers'

export const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'
export const ARBITRUM_SEPOLIA_RPC_URL =
  import.meta.env.VITE_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'

export type ShadowSwapSnapshot = {
  deploymentPending: boolean
  hasBuyOrdersHandle: string
  hasSellOrdersHandle: string
  highestBuyAmountHandle: string
  highestBuyPriceHandle: string
  highestSellAmountHandle: string
  highestSellPriceHandle: string
  orderCount: number
  revealedWinnerAmount: string
  revealedWinnerIsBuy: boolean
  revealedWinnerPrice: string
  revealedWinnerTrader: string
  winnerAmountHandle: string
  winnerDecryptRequested: boolean
  winnerIsBuyHandle: string
  winnerPriceHandle: string
  winnerRevealed: boolean
}

export type OrderbookRow = {
  amountHandle: string
  id: string
  label: string
  priceHandle: string
  side: 'buy' | 'sell' | 'winner'
}

export type SubmitEncryptedOrderParams = {
  encryptedAmount: unknown
  encryptedPrice: unknown
  isBuy: boolean
}

const SHADOW_SWAP_ABI = [
  'function submitOrder((uint256 ctHash,uint8 securityZone,uint8 utype,bytes signature) price,(uint256 ctHash,uint8 securityZone,uint8 utype,bytes signature) amount,bool isBuy)',
  'function matchOrders()',
  'function revealWinner()',
  'function getOrderCount() view returns (uint256)',
  'function hasBuyOrders() view returns (uint256)',
  'function hasSellOrders() view returns (uint256)',
  'function highestBuyPrice() view returns (uint256)',
  'function highestBuyAmount() view returns (uint256)',
  'function highestSellPrice() view returns (uint256)',
  'function highestSellAmount() view returns (uint256)',
  'function winnerPrice() view returns (uint256)',
  'function winnerAmount() view returns (uint256)',
  'function winnerIsBuy() view returns (uint256)',
  'function winnerDecryptRequested() view returns (bool)',
  'function winnerRevealed() view returns (bool)',
  'function revealedWinnerTrader() view returns (address)',
  'function revealedWinnerPrice() view returns (uint256)',
  'function revealedWinnerAmount() view returns (uint256)',
  'function revealedWinnerIsBuy() view returns (bool)',
] as const

const EMPTY_SNAPSHOT: ShadowSwapSnapshot = {
  deploymentPending: true,
  hasBuyOrdersHandle: '0',
  hasSellOrdersHandle: '0',
  highestBuyAmountHandle: '0',
  highestBuyPriceHandle: '0',
  highestSellAmountHandle: '0',
  highestSellPriceHandle: '0',
  orderCount: 0,
  revealedWinnerAmount: '0',
  revealedWinnerIsBuy: false,
  revealedWinnerPrice: '0',
  revealedWinnerTrader: ZeroAddress,
  winnerAmountHandle: '0',
  winnerDecryptRequested: false,
  winnerIsBuyHandle: '0',
  winnerPriceHandle: '0',
  winnerRevealed: false,
}

const getConfiguredAddress = () => {
  const envAddress = import.meta.env.VITE_CONTRACT_ADDRESS?.trim()
  if (!envAddress) return CONTRACT_ADDRESS
  return isAddress(envAddress) ? envAddress : CONTRACT_ADDRESS
}

export const getShadowSwapAddress = () => getConfiguredAddress()

export const isDeploymentPending = () => getConfiguredAddress() === CONTRACT_ADDRESS

const getReadContract = () =>
  new Contract(getConfiguredAddress(), SHADOW_SWAP_ABI, new JsonRpcProvider(ARBITRUM_SEPOLIA_RPC_URL))

const getWriteContract = async () => {
  if (!window.ethereum) {
    throw new Error('No wallet provider found.')
  }

  const provider = new BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()

  return {
    contract: new Contract(getConfiguredAddress(), SHADOW_SWAP_ABI, signer),
    provider,
    signer,
  }
}

export async function submitEncryptedOrder({
  encryptedAmount,
  encryptedPrice,
  isBuy,
}: SubmitEncryptedOrderParams) {
  if (isDeploymentPending()) {
    throw new Error('Deployment pending. Set VITE_CONTRACT_ADDRESS after ShadowSwap is deployed.')
  }

  const { contract } = await getWriteContract()
  const tx = await contract.submitOrder(encryptedPrice, encryptedAmount, isBuy)
  await tx.wait()
  return tx.hash as string
}

export async function matchOrders() {
  if (isDeploymentPending()) {
    throw new Error('Deployment pending. Matching is unavailable until the contract is live.')
  }

  const { contract } = await getWriteContract()
  const tx = await contract.matchOrders()
  await tx.wait()
  return tx.hash as string
}

export async function revealWinner() {
  if (isDeploymentPending()) {
    throw new Error('Deployment pending. Winner reveal is unavailable until the contract is live.')
  }

  const { contract } = await getWriteContract()
  const tx = await contract.revealWinner()
  await tx.wait()
  return tx.hash as string
}

export async function readShadowSwapSnapshot(): Promise<ShadowSwapSnapshot> {
  if (isDeploymentPending()) {
    return EMPTY_SNAPSHOT
  }

  const contract = getReadContract()

  const [
    orderCount,
    hasBuyOrdersHandle,
    hasSellOrdersHandle,
    highestBuyPriceHandle,
    highestBuyAmountHandle,
    highestSellPriceHandle,
    highestSellAmountHandle,
    winnerPriceHandle,
    winnerAmountHandle,
    winnerIsBuyHandle,
    winnerDecryptRequested,
    winnerRevealed,
    revealedWinnerTrader,
    revealedWinnerPrice,
    revealedWinnerAmount,
    revealedWinnerIsBuy,
  ] = await Promise.all([
    contract.getOrderCount(),
    contract.hasBuyOrders(),
    contract.hasSellOrders(),
    contract.highestBuyPrice(),
    contract.highestBuyAmount(),
    contract.highestSellPrice(),
    contract.highestSellAmount(),
    contract.winnerPrice(),
    contract.winnerAmount(),
    contract.winnerIsBuy(),
    contract.winnerDecryptRequested(),
    contract.winnerRevealed(),
    contract.revealedWinnerTrader(),
    contract.revealedWinnerPrice(),
    contract.revealedWinnerAmount(),
    contract.revealedWinnerIsBuy(),
  ])

  return {
    deploymentPending: false,
    hasBuyOrdersHandle: hasBuyOrdersHandle.toString(),
    hasSellOrdersHandle: hasSellOrdersHandle.toString(),
    highestBuyAmountHandle: highestBuyAmountHandle.toString(),
    highestBuyPriceHandle: highestBuyPriceHandle.toString(),
    highestSellAmountHandle: highestSellAmountHandle.toString(),
    highestSellPriceHandle: highestSellPriceHandle.toString(),
    orderCount: Number(orderCount),
    revealedWinnerAmount: revealedWinnerAmount.toString(),
    revealedWinnerIsBuy,
    revealedWinnerPrice: revealedWinnerPrice.toString(),
    revealedWinnerTrader,
    winnerAmountHandle: winnerAmountHandle.toString(),
    winnerDecryptRequested,
    winnerIsBuyHandle: winnerIsBuyHandle.toString(),
    winnerPriceHandle: winnerPriceHandle.toString(),
    winnerRevealed,
  }
}

export async function getOrders() {
  const snapshot = await readShadowSwapSnapshot()

  const rows: OrderbookRow[] = [
    {
      amountHandle: snapshot.highestBuyAmountHandle,
      id: 'best-buy',
      label: 'Best Buy',
      priceHandle: snapshot.highestBuyPriceHandle,
      side: 'buy',
    },
    {
      amountHandle: snapshot.highestSellAmountHandle,
      id: 'best-sell',
      label: 'Best Sell',
      priceHandle: snapshot.highestSellPriceHandle,
      side: 'sell',
    },
  ]

  if (snapshot.winnerPriceHandle !== '0') {
    rows.push({
      amountHandle: snapshot.winnerAmountHandle,
      id: 'winner-preview',
      label: 'Winner Preview',
      priceHandle: snapshot.winnerPriceHandle,
      side: 'winner',
    })
  }

  return rows
}

import { ethers } from 'ethers'
import shadowSwapArtifact from '../../../artifacts/contracts/ShadowSwap.sol/ShadowSwap.json'

export const ARBITRUM_SEPOLIA_RPC_URL =
  import.meta.env.VITE_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS?.trim() || ''
export const SHADOW_SWAP_ABI = shadowSwapArtifact.abi

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

export type IntentMatch = {
  id: string
  intentA: string
  intentB: string
  timestamp: string
}

const getConfiguredAddress = () => {
  const envAddress = CONTRACT_ADDRESS
  if (!envAddress) {
    throw new Error('VITE_CONTRACT_ADDRESS is not set')
  }

  if (!ethers.isAddress(envAddress)) {
    throw new Error(`Invalid VITE_CONTRACT_ADDRESS: ${envAddress}`)
  }

  return envAddress
}

export const getShadowSwapAddress = () => getConfiguredAddress()

export const isDeploymentPending = () => false

const getReadContract = () =>
  new ethers.Contract(getConfiguredAddress(), SHADOW_SWAP_ABI, new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC_URL))

const getReadProvider = () => new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC_URL)

const getWriteContract = async () => {
  if (!window.ethereum) {
    throw new Error('No wallet provider found.')
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  await provider.send('eth_requestAccounts', [])
  const signer = await provider.getSigner()
  const network = await provider.getNetwork()

  if (network.chainId !== 421614n) {
    throw new Error('Wrong network. Switch MetaMask to Arbitrum Sepolia (421614).')
  }

  return {
    contract: new ethers.Contract(getConfiguredAddress(), SHADOW_SWAP_ABI, signer),
    provider,
    signer,
  }
}

export async function submitEncryptedOrder({
  encryptedAmount,
  encryptedPrice,
  isBuy,
}: SubmitEncryptedOrderParams) {
  const { contract } = await getWriteContract()
  const tx = await contract.submitOrder(encryptedPrice, encryptedAmount, isBuy)
  await tx.wait()
  return tx.hash as string
}

export async function submitBlindIntentPayload(encryptedIntent: string) {
  const { contract } = await getWriteContract()
  const tx = await contract.submitIntent(encryptedIntent)
  await tx.wait()
  return tx.hash as string
}

export async function matchOrders() {
  const { contract } = await getWriteContract()
  const tx = await contract.matchOrders()
  await tx.wait()
  return tx.hash as string
}

export async function revealWinner() {
  const { contract } = await getWriteContract()
  const tx = await contract.revealWinner()
  await tx.wait()
  return tx.hash as string
}

export async function readShadowSwapSnapshot(): Promise<ShadowSwapSnapshot> {
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

export async function readMatches(): Promise<IntentMatch[]> {
  const provider = getReadProvider()
  const contract = getReadContract()
  const contractAddress = getConfiguredAddress()
  const contractInterface = new ethers.Interface(SHADOW_SWAP_ABI)
  const eventFragment = contractInterface.getEvent('IntentMatched')

  if (!eventFragment) {
    throw new Error('IntentMatched event is not available in the current contract ABI.')
  }

  const topic = eventFragment.topicHash

  const logs = await provider.getLogs({
    address: contractAddress,
    fromBlock: 0,
    toBlock: 'latest',
    topics: [topic],
  })

  const matchesCount = logs.length

  const matches = await Promise.all(
    Array.from({ length: matchesCount }, async (_, index) => {
      const entry = await contract.matches(index)

      return {
        id: `${index}`,
        intentA: entry.intentA.toString(),
        intentB: entry.intentB.toString(),
        timestamp: entry.timestamp.toString(),
      }
    }),
  )

  return matches.reverse()
}

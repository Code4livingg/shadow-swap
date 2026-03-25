import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  type Eip1193Provider,
  isAddress,
} from 'ethers'
import { decryptBool, decryptUint32, encryptOrderInputs, initializeCofhe } from './cofhe'

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

export type ShadowSwapStatus = {
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

export type DecryptedWinnerPreview = {
  amount: number
  isBuy: boolean
  price: number
}

const getRpcUrl = () =>
  import.meta.env.VITE_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'

const getContractAddress = () => {
  const address = import.meta.env.VITE_CONTRACT_ADDRESS

  if (!address) {
    throw new Error('VITE_CONTRACT_ADDRESS is not set')
  }

  if (!isAddress(address)) {
    throw new Error(`Invalid VITE_CONTRACT_ADDRESS: ${address}`)
  }

  return address
}

const getInjectedProvider = (): Eip1193Provider => {
  const provider = window.ethereum

  if (!provider) {
    throw new Error('No injected wallet found')
  }

  return provider
}

const getBrowserProvider = () => new BrowserProvider(getInjectedProvider())

const getReadContract = () => new Contract(getContractAddress(), SHADOW_SWAP_ABI, new JsonRpcProvider(getRpcUrl()))

const getWriteContract = async () => {
  const provider = getBrowserProvider()
  await provider.send('eth_requestAccounts', [])
  const signer = await provider.getSigner()
  await initializeCofhe(provider, signer)

  return {
    contract: new Contract(getContractAddress(), SHADOW_SWAP_ABI, signer),
  }
}

export async function submitOrder(price: number, amount: number, isBuy: boolean) {
  const { contract } = await getWriteContract()
  const encryptedOrder = await encryptOrderInputs(price, amount)

  const tx = await contract.submitOrder(encryptedOrder.price, encryptedOrder.amount, isBuy)
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

export async function getShadowSwapStatus(): Promise<ShadowSwapStatus> {
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

export async function decryptWinnerPreview(status: ShadowSwapStatus): Promise<DecryptedWinnerPreview> {
  const provider = getBrowserProvider()
  await provider.send('eth_requestAccounts', [])
  const signer = await provider.getSigner()
  await initializeCofhe(provider, signer)

  const [price, amount, isBuy] = await Promise.all([
    decryptUint32(BigInt(status.winnerPriceHandle)),
    decryptUint32(BigInt(status.winnerAmountHandle)),
    decryptBool(BigInt(status.winnerIsBuyHandle)),
  ])

  return {
    amount: Number(amount),
    isBuy,
    price: Number(price),
  }
}

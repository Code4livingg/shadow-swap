import { hexlify } from 'ethers'

export type BlindIntent = {
  tokenIn: string
  tokenOut: string
  amount: string
  slippage: number
  timestamp: number
}

export function encryptIntent(intent: BlindIntent) {
  const serializedIntent = JSON.stringify(intent)
  const encodedIntent = new TextEncoder().encode(serializedIntent)

  return hexlify(encodedIntent)
}

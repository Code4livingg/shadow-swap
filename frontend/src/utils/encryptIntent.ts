export type BlindIntent = {
  amount: string
  direction: 0 | 1
  priceLimit: string
  timestamp: number
  tokenIn: string
  tokenOut: string
}

const UINT32_MAX = 4_294_967_295

export function parseUint32Input(value: string, label: string) {
  if (!/^[0-9]+$/.test(value)) {
    throw new Error(`${label} must be a positive integer for the current CoFHE uint32 flow.`)
  }

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > UINT32_MAX) {
    throw new Error(`${label} must be between 1 and ${UINT32_MAX}.`)
  }

  return parsed
}

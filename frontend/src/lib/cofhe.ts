import { BrowserProvider, JsonRpcSigner, getBytes } from 'ethers'

const FheTypes = {
  Bool: 0,
  Uint8: 2,
  Uint32: 4,
} as const

type CoFheInItem<TUtype extends number> = {
  ctHash: bigint
  securityZone: number
  utype: TUtype
  signature: string
}

type CoFheInUint8 = CoFheInItem<(typeof FheTypes)['Uint8']>
type CoFheInUint32 = CoFheInItem<(typeof FheTypes)['Uint32']>

type Result<T> = {
  success: boolean
  data: T | null
  error: { message: string } | null
}

type BrowserCofheModule = {
  Encryptable: {
    uint8: (value: bigint) => unknown
    uint32: (value: bigint) => unknown
  }
  cofhejs: {
    decrypt: <T>(handle: bigint, fheType: number) => Promise<Result<T>>
    encrypt: <T extends readonly unknown[]>(values: T) => Promise<Result<unknown[]>>
    initializeWithEthers: (args: {
      environment: 'TESTNET'
      ethersProvider: BrowserProvider
      ethersSigner: JsonRpcSigner
      generatePermit: boolean
    }) => Promise<Result<unknown>>
  }
}

type EncryptedOrderInputs = {
  amount: CoFheInUint32
  price: CoFheInUint32
}

export type EncryptedIntentInputs = {
  amount: CoFheInUint32
  direction: CoFheInUint8
  priceLimit: CoFheInUint32
}

export type IntentSignatureLengths = {
  amountSignatureLength: number | null
  directionSignatureLength: number | null
  priceLimitSignatureLength: number | null
}

let initializedAccount: string | null = null
let browserCofheModulePromise: Promise<BrowserCofheModule> | null = null

const unwrapResult = <T>(result: Result<T>): T => {
  if (!result.success || result.data === null) {
    throw new Error(result.error?.message ?? 'Unknown CoFHE error')
  }

  return result.data
}

async function loadBrowserCofheModule(): Promise<BrowserCofheModule> {
  if (!browserCofheModulePromise) {
    const importUrl = 'https://esm.sh/cofhejs@0.3.1/web?bundle'
    browserCofheModulePromise = new Function('u', 'return import(u)')(importUrl) as Promise<BrowserCofheModule>
  }

  return browserCofheModulePromise
}

const signatureByteLength = (signature: string | undefined): number | null => {
  if (!signature) {
    return null
  }

  try {
    return getBytes(signature).length
  } catch {
    return null
  }
}

export function getIntentSignatureLengths(encryptedIntent: EncryptedIntentInputs): IntentSignatureLengths {
  return {
    amountSignatureLength: signatureByteLength(encryptedIntent.amount.signature),
    directionSignatureLength: signatureByteLength(encryptedIntent.direction.signature),
    priceLimitSignatureLength: signatureByteLength(encryptedIntent.priceLimit.signature),
  }
}

export function assertValidIntentSignatures(encryptedIntent: EncryptedIntentInputs) {
  const signatureLengths = getIntentSignatureLengths(encryptedIntent)
  const invalidEntries = Object.entries(signatureLengths).filter(([, length]) => length !== 65)

  if (invalidEntries.length > 0) {
    throw new Error(`Invalid CoFHE signature length: ${JSON.stringify(signatureLengths)}`)
  }
}

export async function initializeCofhe(provider: BrowserProvider, signer: JsonRpcSigner) {
  const account = await signer.getAddress()

  if (initializedAccount === account) {
    return
  }

  const { cofhejs } = await loadBrowserCofheModule()
  const result = await cofhejs.initializeWithEthers({
    environment: 'TESTNET',
    ethersProvider: provider,
    ethersSigner: signer,
    generatePermit: true,
  })

  unwrapResult(result)
  initializedAccount = account
}

export async function encryptOrderInputs(price: number, amount: number): Promise<EncryptedOrderInputs> {
  const { cofhejs, Encryptable } = await loadBrowserCofheModule()
  const result = await cofhejs.encrypt([
    Encryptable.uint32(BigInt(price)),
    Encryptable.uint32(BigInt(amount)),
  ] as const)

  const [encryptedPrice, encryptedAmount] = unwrapResult(result) as [CoFheInUint32, CoFheInUint32]

  return {
    amount: encryptedAmount,
    price: encryptedPrice,
  }
}

export async function encryptIntentInputs(
  amount: number,
  direction: number,
  priceLimit: number,
): Promise<EncryptedIntentInputs> {
  const { cofhejs, Encryptable } = await loadBrowserCofheModule()
  const result = await cofhejs.encrypt([
    Encryptable.uint32(BigInt(amount)),
    Encryptable.uint8(BigInt(direction)),
    Encryptable.uint32(BigInt(priceLimit)),
  ] as const)

  const [encryptedAmount, encryptedDirection, encryptedPriceLimit] = unwrapResult(result) as [
    CoFheInUint32,
    CoFheInUint8,
    CoFheInUint32,
  ]

  return {
    amount: encryptedAmount,
    direction: encryptedDirection,
    priceLimit: encryptedPriceLimit,
  }
}

export async function decryptUint32(handle: bigint): Promise<bigint> {
  const { cofhejs } = await loadBrowserCofheModule()
  const result = await cofhejs.decrypt(handle, FheTypes.Uint32)
  return unwrapResult(result) as bigint
}

export async function decryptBool(handle: bigint): Promise<boolean> {
  const { cofhejs } = await loadBrowserCofheModule()
  const result = await cofhejs.decrypt(handle, FheTypes.Bool)
  return unwrapResult(result) as boolean
}

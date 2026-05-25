import type { BrowserProvider, JsonRpcSigner } from 'ethers'

export const FheTypes = {
  Bool: 0,
  Uint8: 2,
  Uint16: 3,
  Uint32: 4,
  Uint64: 5,
  Uint128: 6,
  Uint160: 7,
  Uint256: 8,
} as const

type FheTypesValue = (typeof FheTypes)[keyof typeof FheTypes]

type BrowserFheValue = {
  ctHash: bigint
  securityZone: number
  signature: string
  utype: FheTypesValue
}

type Result<T> = {
  success: boolean
  data: T | null
  error: { message: string } | null
}

type InitializeArgs = {
  provider: BrowserProvider
  environment: 'TESTNET'
}

type BrowserCofheModule = {
  Encryptable: {
    uint8: (value: bigint) => unknown
    uint32: (value: bigint) => unknown
  }
  cofhejs: {
    encrypt: (value: readonly [unknown]) => Promise<Result<[BrowserFheValue]>>
    initializeWithEthers: (args: {
      environment: 'TESTNET'
      ethersProvider: BrowserProvider
      ethersSigner: JsonRpcSigner
      generatePermit: boolean
    }) => Promise<Result<unknown>>
  }
}

let browserCofheModulePromise: Promise<BrowserCofheModule> | null = null

const unwrapResult = <T>(result: Result<T>): T => {
  if (!result.success || result.data === null) {
    throw new Error(result.error?.message ?? 'Unknown CoFHE error')
  }

  return result.data
}

async function getSigner(provider: BrowserProvider): Promise<JsonRpcSigner> {
  return provider.getSigner()
}

async function loadBrowserCofheModule(): Promise<BrowserCofheModule> {
  if (!browserCofheModulePromise) {
    const importUrl = 'https://esm.sh/cofhejs@0.3.1/web?bundle'
    browserCofheModulePromise = new Function('u', 'return import(u)')(importUrl) as Promise<BrowserCofheModule>
  }

  return browserCofheModulePromise
}

async function initialize({ environment, provider }: InitializeArgs) {
  const { cofhejs: browserCofhejs } = await loadBrowserCofheModule()
  const signer = await getSigner(provider)

  const result = await browserCofhejs.initializeWithEthers({
    environment,
    ethersProvider: provider,
    ethersSigner: signer,
    generatePermit: true,
  })

  return unwrapResult(result)
}

async function encrypt(
  value: number,
  fheType: (typeof FheTypes)['Uint8'] | (typeof FheTypes)['Uint32'],
): Promise<BrowserFheValue> {
  const { Encryptable, cofhejs: browserCofhejs } = await loadBrowserCofheModule()
  const encryptable =
    fheType === FheTypes.Uint8
      ? Encryptable.uint8(BigInt(value))
      : Encryptable.uint32(BigInt(value))

  const result = await browserCofhejs.encrypt([encryptable] as const)
  const [encryptedValue] = unwrapResult(result)

  return encryptedValue
}

export const cofhejs = {
  initialize,
  encrypt,
}

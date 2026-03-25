import { BrowserProvider, JsonRpcSigner } from 'ethers'
import { cofhejs, Encryptable, FheTypes, type CoFheInUint32 } from 'cofhejs/web'

type Result<T> = {
  success: boolean
  data: T | null
  error: { message: string } | null
}

type EncryptedOrderInputs = {
  amount: CoFheInUint32
  price: CoFheInUint32
}

let initializedAccount: string | null = null

const unwrapResult = <T>(result: Result<T>): T => {
  if (!result.success || result.data === null) {
    throw new Error(result.error?.message ?? 'Unknown CoFHE error')
  }

  return result.data
}

export async function initializeCofhe(provider: BrowserProvider, signer: JsonRpcSigner) {
  const account = await signer.getAddress()

  if (initializedAccount === account) {
    return
  }

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
  const result = await cofhejs.encrypt([
    Encryptable.uint32(BigInt(price)),
    Encryptable.uint32(BigInt(amount)),
  ] as const)

  const [encryptedPrice, encryptedAmount] = unwrapResult(result)

  return {
    amount: encryptedAmount,
    price: encryptedPrice,
  }
}

export async function decryptUint32(handle: bigint): Promise<bigint> {
  const result = await cofhejs.decrypt(handle, FheTypes.Uint32)
  return unwrapResult(result)
}

export async function decryptBool(handle: bigint): Promise<boolean> {
  const result = await cofhejs.decrypt(handle, FheTypes.Bool)
  return unwrapResult(result)
}

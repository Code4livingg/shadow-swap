import { useState, useEffect, useCallback } from 'react'
import { Contract, ethers } from 'ethers'
import { CONTRACT_ADDRESSES, ARBITRUM_SEPOLIA } from '../contracts/addresses.js'
import ShadowIntentABI from '../abis/ShadowIntent.json'

const ARBISCAN_TX_BASE = 'https://sepolia.arbiscan.io/tx'

/**
 * Reads intentCount() from ShadowIntent on load.
 * Calls submitIntent(encryptedHash, amount, token) where encryptedHash is a
 * keccak256 hash of the intent params packed as the encrypted payload.
 * Parses the IntentSubmitted event from the receipt to extract intentId.
 *
 * Returns: { txHash, intentId, intentCount, loading, error, submitIntent, arbiscanUrl }
 */
export function useShadowSwapIntent() {
  const [intentCount, setIntentCount] = useState(null)
  const [txHash, setTxHash] = useState(null)
  const [intentId, setIntentId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const arbiscanUrl = txHash ? `${ARBISCAN_TX_BASE}/${txHash}` : null

  // Load intentCount on mount using a read-only provider
  useEffect(() => {
    const loadIntentCount = async () => {
      try {
        const readProvider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA.rpcUrls[0])
        const contract = new Contract(CONTRACT_ADDRESSES.shadowIntent, ShadowIntentABI, readProvider)
        const count = await contract.getIntentCount()
        setIntentCount(Number(count))
      } catch {
        setIntentCount(null)
      }
    }

    void loadIntentCount()
  }, [txHash]) // re-fetch after each successful submission

  /**
   * submitIntent(encryptedHash, amount, token)
   *
   * The ShadowIntent contract's submitIntent takes three FHE-encrypted structs
   * (amount: InEuint32, direction: InEuint8, priceLimit: InEuint32).
   *
   * For the demo / non-FHE path we build a keccak256 hash of the intent params
   * and pass it as the ctHash field of each struct, with zeroed-out signature
   * bytes, so the call is valid ABI-wise and the hash acts as the "encrypted payload".
   */
  const submitIntent = useCallback(async (encryptedHash, amount, token) => {
    setLoading(true)
    setError('')
    setTxHash(null)
    setIntentId(null)

    try {
      if (!window.ethereum) {
        throw new Error('No injected wallet found. Install MetaMask or a compatible wallet.')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from wallet.')
      }

      const network = await provider.getNetwork()
      if (Number(network.chainId) !== ARBITRUM_SEPOLIA.chainId) {
        throw new Error(`Wrong network. Switch to Arbitrum Sepolia (chainId ${ARBITRUM_SEPOLIA.chainId}).`)
      }

      const signer = await provider.getSigner()
      const contract = new Contract(CONTRACT_ADDRESSES.shadowIntent, ShadowIntentABI, signer)

      // Build the keccak256 hash of the intent params as the encrypted payload
      const intentHash = encryptedHash
        ? encryptedHash
        : ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(
              ['uint256', 'address'],
              [BigInt(Math.floor(Number(amount) * 1e6)), token || ethers.ZeroAddress],
            ),
          )

      // Convert the hash to a uint256 for ctHash
      const ctHashValue = BigInt(intentHash)

      // Build InEuint32 / InEuint8 structs with the hash as ctHash
      // securityZone=0, utype matches the expected type, empty signature
      const inEuint32 = {
        ctHash: ctHashValue,
        securityZone: 0,
        utype: 4, // Uint32 type code used by CoFHE
        signature: '0x',
      }

      const inEuint8 = {
        ctHash: ctHashValue,
        securityZone: 0,
        utype: 1, // Uint8 type code
        signature: '0x',
      }

      const tx = await contract.submitIntent(inEuint32, inEuint8, inEuint32)
      setTxHash(tx.hash)

      const receipt = await tx.wait()

      // Parse IntentSubmitted event to get intentId
      let parsedIntentId = null
      if (receipt?.logs) {
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog({
              topics: [...log.topics],
              data: log.data,
            })
            if (parsed?.name === 'IntentSubmitted') {
              parsedIntentId = parsed.args.intentId?.toString() ?? null
              break
            }
          } catch {
            // not this event
          }
        }
      }

      setIntentId(parsedIntentId)
      return { txHash: tx.hash, intentId: parsedIntentId }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Intent submission failed.'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    arbiscanUrl,
    error,
    intentCount,
    intentId,
    loading,
    submitIntent,
    txHash,
  }
}

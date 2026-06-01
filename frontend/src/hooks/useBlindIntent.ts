import { useCallback, useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { arbitrumSepolia } from 'wagmi/chains'
import addresses from '../../../deployments/addresses.json'
import { ShadowIntentABI } from '../abis'
import {
  assertValidIntentSignatures,
  encryptIntentInputs,
  getIntentSignatureLengths,
  initializeCofhe,
} from '../lib/cofhe'
import { ARBITRUM_SEPOLIA_RPC_URL } from '../contracts/ShadowSwap'
import { parseUint32Input, type BlindIntent } from '../utils/encryptIntent'

const ARBITRUM_SEPOLIA_HEX = `0x${arbitrumSepolia.id.toString(16)}`

type ShadowIntentAddresses = {
  shadowIntent?: string
}

const deploymentConfig = addresses as ShadowIntentAddresses
const SHADOW_INTENT_ADDRESS = deploymentConfig.shadowIntent ?? ''

async function ensureArbitrumSepolia() {
  if (!window.ethereum) {
    throw new Error('No wallet detected. Install MetaMask to submit a blind intent.')
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ARBITRUM_SEPOLIA_HEX }],
    })
  } catch {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          blockExplorerUrls: ['https://sepolia.arbiscan.io'],
          chainId: ARBITRUM_SEPOLIA_HEX,
          chainName: 'Arbitrum Sepolia',
          nativeCurrency: {
            decimals: 18,
            name: 'ETH',
            symbol: 'ETH',
          },
          rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
        },
      ],
    })
  }
}

export function useBlindIntent() {
  const [submittingBlindIntent, setSubmittingBlindIntent] = useState(false)

  useEffect(() => {
    if (!SHADOW_INTENT_ADDRESS) {
      return
    }

    const provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC_URL)
    const contract = new ethers.Contract(SHADOW_INTENT_ADDRESS, ShadowIntentABI, provider)

    const handleIntentSubmitted = (user: string, intentId: bigint) => {
      console.log('IntentSubmitted', {
        intentId: intentId.toString(),
        user,
      })
    }

    const handleMatchCreated = (intentA: bigint, intentB: bigint) => {
      console.log('MatchCreated', {
        intentA: intentA.toString(),
        intentB: intentB.toString(),
      })
    }

    contract.on('IntentSubmitted', handleIntentSubmitted)
    contract.on('IntentMatched', handleMatchCreated)

    return () => {
      contract.off('IntentSubmitted', handleIntentSubmitted)
      contract.off('IntentMatched', handleMatchCreated)
    }
  }, [])

  const submitBlindIntent = useCallback(async (intent: BlindIntent) => {
    setSubmittingBlindIntent(true)

    try {
      await ensureArbitrumSepolia()

      if (!window.ethereum) {
        throw new Error('No wallet provider found.')
      }

      if (!ethers.isAddress(SHADOW_INTENT_ADDRESS)) {
        throw new Error('ShadowIntent deployment address is not configured.')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const network = await provider.getNetwork()

      if (network.chainId !== 421614n) {
        throw new Error('Wrong network. Switch MetaMask to Arbitrum Sepolia (421614).')
      }

      const amount = parseUint32Input(intent.amount, 'Amount')
      const priceLimit = parseUint32Input(intent.priceLimit, 'Price limit')

      await initializeCofhe(provider, signer)
      const encryptedIntent = await encryptIntentInputs(amount, intent.direction, priceLimit)

      const contract = new ethers.Contract(SHADOW_INTENT_ADDRESS, ShadowIntentABI, signer)

      console.log('Wallet connected:', signer.address)
      console.log('ShadowIntent contract:', SHADOW_INTENT_ADDRESS)
      console.log('Submitting intent...')
      console.log('encrypted amount', encryptedIntent.amount)
      console.log('encrypted direction', encryptedIntent.direction)
      console.log('encrypted priceLimit', encryptedIntent.priceLimit)
      console.log(getIntentSignatureLengths(encryptedIntent))
      assertValidIntentSignatures(encryptedIntent)

      const tx = await contract.submitIntent(
        encryptedIntent.amount,
        encryptedIntent.direction,
        encryptedIntent.priceLimit,
      )
      await tx.wait()

      console.log('Intent submitted:', tx.hash)

      return tx.hash as string
    } catch (err) {
      console.error('Submit failed:', err)
      throw err
    } finally {
      setSubmittingBlindIntent(false)
    }
  }, [])

  return {
    submitBlindIntent,
    submittingBlindIntent,
  }
}

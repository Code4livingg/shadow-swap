import { ethers, network } from 'hardhat'
import { ShadowSwap__factory } from '../../typechain-types'

const POLL_INTERVAL_MS = 5_000
const DEFAULT_CONTRACT_ADDRESS = '0xE60309Cd41d29C4c320bFbDef6f1f55244D37d41'

type IntentRecord = {
  amount: bigint
  encryptedPayload: string
  index: bigint
  isBuy: boolean
  isRangeIntent: boolean
  matched: boolean
  maxPrice: bigint
  minPrice: bigint
  open: boolean
  timestamp: bigint
  user: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const getContractAddress = () =>
  process.env.SHADOW_SWAP_ADDRESS ||
  process.env.CONTRACT_ADDRESS ||
  process.env.VITE_CONTRACT_ADDRESS ||
  DEFAULT_CONTRACT_ADDRESS

function normalizePair(intentA: bigint, intentB: bigint) {
  return intentA < intentB ? `${intentA}-${intentB}` : `${intentB}-${intentA}`
}

function getExecutableRange(buyIntent: IntentRecord, sellIntent: IntentRecord) {
  const overlapMin = buyIntent.minPrice > sellIntent.minPrice ? buyIntent.minPrice : sellIntent.minPrice
  const overlapMax = buyIntent.maxPrice < sellIntent.maxPrice ? buyIntent.maxPrice : sellIntent.maxPrice

  if (overlapMin > overlapMax) {
    return null
  }

  return {
    overlapMax,
    overlapMin,
  }
}

function areIntentsCompatible(intentA: IntentRecord, intentB: IntentRecord) {
  if (intentA.index === intentB.index) {
    return false
  }

  if (intentA.user.toLowerCase() === intentB.user.toLowerCase()) {
    return false
  }

  if (!intentA.isRangeIntent || !intentB.isRangeIntent) {
    return false
  }

  if (!intentA.open || !intentB.open || intentA.matched || intentB.matched) {
    return false
  }

  if (intentA.amount === 0n || intentB.amount === 0n) {
    return false
  }

  if (intentA.isBuy === intentB.isBuy) {
    return false
  }

  const buyIntent = intentA.isBuy ? intentA : intentB
  const sellIntent = intentA.isBuy ? intentB : intentA

  if (buyIntent.maxPrice < sellIntent.minPrice) {
    return false
  }

  return getExecutableRange(buyIntent, sellIntent) !== null
}

async function main() {
  const [signer] = await ethers.getSigners()

  if (!signer) {
    throw new Error(`No signer available for ${network.name}. Set PRIVATE_KEY in your environment.`)
  }

  const contractAddress = getContractAddress()
  const contract = ShadowSwap__factory.connect(contractAddress, signer)

  console.log('Auto matcher signer:', signer.address)
  console.log('Network:', network.name)
  console.log('ShadowSwap:', contractAddress)

  while (true) {
    console.log('Matching intents...')

    try {
      const intentCount = await contract.getIntentCount()
      const matchedLogs = await contract.queryFilter(contract.filters.IntentMatched())
      const matchedPairs = new Set(
        matchedLogs.map((log) => normalizePair(log.args.intentA, log.args.intentB)),
      )

      const intents = await Promise.all(
        Array.from({ length: Number(intentCount) }, async (_, index) => {
          const intent = await contract.intents(index)

          return {
            amount: intent.amount,
            encryptedPayload: intent.encryptedPayload,
            index: BigInt(index),
            isBuy: intent.isBuy,
            isRangeIntent: intent.isRangeIntent,
            matched: intent.matched,
            maxPrice: intent.maxPrice,
            minPrice: intent.minPrice,
            open: intent.open,
            timestamp: intent.timestamp,
            user: intent.user,
          } satisfies IntentRecord
        }),
      )

      let bestPair:
        | {
            buyIntent: IntentRecord
            overlapWidth: bigint
            pairKey: string
            sellIntent: IntentRecord
          }
        | undefined

      for (let i = 0; i < intents.length; i += 1) {
        for (let j = i + 1; j < intents.length; j += 1) {
          const intentA = intents[i]
          const intentB = intents[j]
          const pairKey = normalizePair(intentA.index, intentB.index)

          if (matchedPairs.has(pairKey)) {
            continue
          }

          if (!areIntentsCompatible(intentA, intentB)) {
            continue
          }

          const buyIntent = intentA.isBuy ? intentA : intentB
          const sellIntent = intentA.isBuy ? intentB : intentA
          const executableRange = getExecutableRange(buyIntent, sellIntent)

          if (!executableRange) {
            continue
          }

          const overlapWidth = executableRange.overlapMax - executableRange.overlapMin

          if (!bestPair || overlapWidth < bestPair.overlapWidth) {
            bestPair = {
              buyIntent,
              overlapWidth,
              pairKey,
              sellIntent,
            }
          }
        }
      }

      if (bestPair && !matchedPairs.has(bestPair.pairKey)) {
        console.log('Match found', {
          buyIntent: bestPair.buyIntent.index.toString(),
          buyRange: `${bestPair.buyIntent.minPrice.toString()}-${bestPair.buyIntent.maxPrice.toString()}`,
          sellIntent: bestPair.sellIntent.index.toString(),
          sellRange: `${bestPair.sellIntent.minPrice.toString()}-${bestPair.sellIntent.maxPrice.toString()}`,
        })

        const tx = await contract.autoMatch(bestPair.buyIntent.index, bestPair.sellIntent.index)
        console.log('autoMatch triggered', tx.hash)
        await tx.wait()
      }
    } catch (error) {
      console.error('Matcher iteration failed:', error)
    }

    await sleep(POLL_INTERVAL_MS)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

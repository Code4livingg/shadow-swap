import { ethers, network } from 'hardhat'
import { ShadowSwap__factory } from '../../typechain-types'

const POLL_INTERVAL_MS = 5_000
const DEFAULT_CONTRACT_ADDRESS = '0xE60309Cd41d29C4c320bFbDef6f1f55244D37d41'

type IntentRecord = {
  encryptedPayload: string
  index: bigint
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

function areIntentsCompatible(intentA: IntentRecord, intentB: IntentRecord) {
  if (intentA.index === intentB.index) {
    return false
  }

  if (intentA.user.toLowerCase() === intentB.user.toLowerCase()) {
    return false
  }

  // Payloads remain encrypted, so the matcher can only use observable metadata.
  // This heuristic avoids self-matches and duplicate ciphertext pairs.
  return intentA.encryptedPayload !== intentB.encryptedPayload
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
            encryptedPayload: intent.encryptedPayload,
            index: BigInt(index),
            timestamp: intent.timestamp,
            user: intent.user,
          } satisfies IntentRecord
        }),
      )

      let matchTriggered = false

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

          console.log('Match found', {
            intentA: intentA.index.toString(),
            intentB: intentB.index.toString(),
          })

          const tx = await contract.autoMatch(intentA.index, intentB.index)
          console.log('autoMatch triggered', tx.hash)
          await tx.wait()

          matchTriggered = true
          break
        }

        if (matchTriggered) {
          break
        }
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

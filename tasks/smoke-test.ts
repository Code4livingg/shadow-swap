import { readFileSync } from 'fs'
import path from 'path'
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { cofhejs, Encryptable } from 'cofhejs/node'

type DeploymentAddresses = {
	chainId?: number
	network?: string
	shadowIntent?: string
	shadowMatcher?: string
	shadowSettlement?: string
}

const readDeploymentAddresses = () => {
	const deploymentPath = path.join(process.cwd(), 'deployments', 'addresses.json')
	const contents = readFileSync(deploymentPath, 'utf8')
	return JSON.parse(contents) as DeploymentAddresses
}

task('smoke-test', 'Smoke-tests deployed ShadowSwap contracts on Arbitrum Sepolia').setAction(
	async (_, hre: HardhatRuntimeEnvironment) => {
		const { ethers, network } = hre
		const addresses = readDeploymentAddresses()

		if (!addresses.shadowIntent || !ethers.isAddress(addresses.shadowIntent)) {
			throw new Error('deployments/addresses.json is missing a valid shadowIntent address')
		}

		if (!addresses.shadowMatcher || !ethers.isAddress(addresses.shadowMatcher)) {
			throw new Error('deployments/addresses.json is missing a valid shadowMatcher address')
		}

		if (!addresses.shadowSettlement || !ethers.isAddress(addresses.shadowSettlement)) {
			throw new Error('deployments/addresses.json is missing a valid shadowSettlement address')
		}

		const [deployer] = await ethers.getSigners()
		if (!deployer) {
			throw new Error(`No deployer account available for ${network.name}. Set PRIVATE_KEY in your environment.`)
		}

		const ShadowIntent = await ethers.getContractFactory('ShadowIntent')
		const ShadowMatcher = await ethers.getContractFactory('ShadowMatcher')
		const ShadowSettlement = await ethers.getContractFactory('ShadowSettlement')

		const shadowIntent = ShadowIntent.attach(addresses.shadowIntent)
		ShadowMatcher.attach(addresses.shadowMatcher)
		ShadowSettlement.attach(addresses.shadowSettlement)

		await hre.cofhe.initializeWithHardhatSigner(deployer).catch(async () => {
			const initResult = await cofhejs.initializeWithEthers({
				environment: 'TESTNET',
				ethersProvider: deployer.provider,
				ethersSigner: deployer,
				generatePermit: true,
			})

			if (!initResult.success) {
				throw new Error(initResult.error?.message ?? 'Failed to initialize cofhejs for live smoke test')
			}
		})

		const encryptedInputs = await cofhejs.encrypt([
			Encryptable.uint32('1000'),
			Encryptable.uint8('1'),
			Encryptable.uint32('385000'),
		] as const)

		if (!encryptedInputs.success || !encryptedInputs.data) {
			throw new Error(encryptedInputs.error?.message ?? 'Failed to encrypt smoke test inputs')
		}

		const [encAmount, encDirection, encPriceLimit] = encryptedInputs.data

		const tx = await shadowIntent.submitIntent(encAmount, encDirection, encPriceLimit)
		const receipt = await tx.wait()

		const parsedEvent = receipt?.logs
			.map((log) => {
				try {
					return shadowIntent.interface.parseLog(log)
				} catch {
					return null
				}
			})
			.find((event) => event?.name === 'IntentSubmitted')

		if (!parsedEvent) {
			throw new Error('IntentSubmitted event not found in smoke test transaction receipt')
		}

		const trader = parsedEvent.args[0] as string
		const intentId = parsedEvent.args[1].toString()

		console.log(`Intent submitted. ID: ${intentId}, Trader: ${trader}, TxHash: ${tx.hash}`)

		const intentCount = await shadowIntent.getIntentCount()
		console.log(`Intent count: ${intentCount.toString()}`)

		const matched = await shadowIntent.isMatched(intentId)
		console.log(`Matched: ${matched}`)

		console.log('Smoke test PASSED')
	},
)

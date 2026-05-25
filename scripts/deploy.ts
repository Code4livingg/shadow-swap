import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { ethers, network } from 'hardhat'

async function main() {
	const [deployer] = await ethers.getSigners()

	if (!deployer) {
		throw new Error(`No deployer account available for ${network.name}. Set PRIVATE_KEY in your environment.`)
	}

	console.log('Deploying with:', deployer.address)
	console.log('Network:', network.name)

	const currentNonce = await ethers.provider.getTransactionCount(deployer.address)
	const intentAddress = ethers.getCreateAddress({ from: deployer.address, nonce: currentNonce })
	const settlementAddress = ethers.getCreateAddress({ from: deployer.address, nonce: currentNonce + 1 })
	const matcherAddress = ethers.getCreateAddress({ from: deployer.address, nonce: currentNonce + 2 })

	const ShadowIntent = await ethers.getContractFactory('ShadowIntent')
	const ShadowSettlement = await ethers.getContractFactory('ShadowSettlement')
	const ShadowMatcher = await ethers.getContractFactory('ShadowMatcher')

	const shadowIntent = await ShadowIntent.deploy(matcherAddress)
	await shadowIntent.waitForDeployment()

	const shadowSettlement = await ShadowSettlement.deploy(intentAddress, matcherAddress)
	await shadowSettlement.waitForDeployment()

	const shadowMatcher = await ShadowMatcher.deploy(intentAddress, settlementAddress)
	await shadowMatcher.waitForDeployment()

	const addresses = {
		network: network.name,
		chainId: Number(network.config.chainId ?? 0),
		shadowIntent: await shadowIntent.getAddress(),
		shadowSettlement: await shadowSettlement.getAddress(),
		shadowMatcher: await shadowMatcher.getAddress(),
	}

	const deploymentsDir = path.join(process.cwd(), 'deployments')
	const frontendPublicDir = path.join(process.cwd(), 'frontend', 'public')
	const addressesJson = `${JSON.stringify(addresses, null, 2)}\n`
	const addressesJs = `export const addresses = ${JSON.stringify(addresses, null, 2)}\n`

	mkdirSync(deploymentsDir, { recursive: true })
	mkdirSync(frontendPublicDir, { recursive: true })

	writeFileSync(path.join(deploymentsDir, 'addresses.json'), addressesJson, 'utf8')
	writeFileSync(path.join(deploymentsDir, 'addresses.js'), addressesJs, 'utf8')
	writeFileSync(path.join(frontendPublicDir, 'addresses.json'), addressesJson, 'utf8')

	console.log('ShadowIntent:', addresses.shadowIntent)
	console.log('ShadowSettlement:', addresses.shadowSettlement)
	console.log('ShadowMatcher:', addresses.shadowMatcher)
	console.log('Addresses written to deployments/addresses.json')
	console.log('Addresses written to deployments/addresses.js')
	console.log('Addresses copied to frontend/public/addresses.json')
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})

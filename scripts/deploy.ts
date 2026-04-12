import { ethers, network } from 'hardhat'

async function main() {
	const [deployer] = await ethers.getSigners()

	if (!deployer) {
		throw new Error(`No deployer account available for ${network.name}. Set PRIVATE_KEY in your environment.`)
	}

	console.log('Deploying with:', deployer.address)
	console.log('Network:', network.name)

	const ShadowSwap = await ethers.getContractFactory('ShadowSwap')
	const contract = await ShadowSwap.deploy()

	await contract.waitForDeployment()

	const contractAddress = await contract.getAddress()
	const deploymentTx = contract.deploymentTransaction()
	const receipt = deploymentTx ? await deploymentTx.wait() : null

	console.log('ShadowSwap deployed to:', contractAddress)
	console.log('Gas used:', receipt?.gasUsed?.toString() ?? 'unknown')
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})

import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { saveDeployment } from './utils'

task('deploy-shadow-swap', 'Deploy the ShadowSwap contract to the selected network').setAction(async (_, hre: HardhatRuntimeEnvironment) => {
	const { ethers, network } = hre

	console.log(`Deploying ShadowSwap to ${network.name}...`)

	const [deployer] = await ethers.getSigners()
	if (!deployer) {
		throw new Error(`No deployer account available for ${network.name}. Set PRIVATE_KEY in your environment.`)
	}

	console.log(`Deploying with account: ${deployer.address}`)

	const ShadowSwap = await ethers.getContractFactory('ShadowSwap')
	const shadowSwap = await ShadowSwap.deploy()
	await shadowSwap.waitForDeployment()

	const shadowSwapAddress = await shadowSwap.getAddress()
	console.log(`ShadowSwap deployed to: ${shadowSwapAddress}`)

	saveDeployment(network.name, 'ShadowSwap', shadowSwapAddress)

	return shadowSwapAddress
})

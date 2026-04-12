import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@nomicfoundation/hardhat-ethers'
import '@nomicfoundation/hardhat-verify'
import 'cofhe-hardhat-plugin'
import * as dotenv from 'dotenv'
import './tasks'

dotenv.config()
const PRIVATE_KEY = process.env.PRIVATE_KEY || ''
const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || ''

const config: HardhatUserConfig = {
	solidity: {
		version: '0.8.25',
		settings: {
			evmVersion: 'cancun',
		},
	},
	defaultNetwork: 'hardhat',
	// defaultNetwork: 'localcofhe',
	networks: {
		// The plugin already provides localcofhe configuration

		// Sepolia testnet configuration
		'eth-sepolia': {
			url: process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com',
			accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
			chainId: 11155111,
			gasMultiplier: 1.2,
			timeout: 60000,
			httpHeaders: {},
		},

		arbitrumSepolia: {
			url: RPC_URL,
			accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
			chainId: 421614,
		},

		// Arbitrum Sepolia testnet configuration
		'arb-sepolia': {
			url: RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
			accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
			chainId: 421614,
			gasMultiplier: 1.2,
			timeout: 60000,
			httpHeaders: {},
		},
	},

	etherscan: {
		apiKey: process.env.ARBISCAN_API_KEY,
		customChains: [
			{
				network: 'arbitrumSepolia',
				chainId: 421614,
				urls: {
					apiURL: 'https://api-sepolia.arbiscan.io/api',
					browserURL: 'https://sepolia.arbiscan.io',
				},
			},
		],
	},
}

export default config

import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'

type ArtifactFile = {
	abi: unknown
}

const ABI_TARGETS = [
	{
		artifact: 'artifacts/contracts/ShadowIntent.sol/ShadowIntent.json',
		output: 'frontend/src/abis/ShadowIntent.json',
	},
	{
		artifact: 'artifacts/contracts/ShadowMatcher.sol/ShadowMatcher.json',
		output: 'frontend/src/abis/ShadowMatcher.json',
	},
	{
		artifact: 'artifacts/contracts/ShadowSettlement.sol/ShadowSettlement.json',
		output: 'frontend/src/abis/ShadowSettlement.json',
	},
] as const

function main() {
	const rootDir = process.cwd()
	const abisDir = path.join(rootDir, 'frontend', 'src', 'abis')

	mkdirSync(abisDir, { recursive: true })

	for (const target of ABI_TARGETS) {
		const artifactPath = path.join(rootDir, target.artifact)
		const outputPath = path.join(rootDir, target.output)
		const artifact = JSON.parse(readFileSync(artifactPath, 'utf8')) as ArtifactFile

		writeFileSync(outputPath, `${JSON.stringify(artifact.abi, null, 2)}\n`, 'utf8')
		console.log(`Wrote ABI: ${target.output}`)
	}

	const indexContents = [
		"export { default as ShadowIntentABI } from './ShadowIntent.json'",
		"export { default as ShadowMatcherABI } from './ShadowMatcher.json'",
		"export { default as ShadowSettlementABI } from './ShadowSettlement.json'",
	].join('\n')

	writeFileSync(path.join(abisDir, 'index.ts'), `${indexContents}\n`, 'utf8')
	console.log('Wrote ABI index: frontend/src/abis/index.ts')
}

main()

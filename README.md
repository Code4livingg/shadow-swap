# ShadowSwap — Blind Intent Matching Protocol

> ShadowSwap is a blind intent matching protocol for Arbitrum Sepolia: markets discover executable prices without any participant revealing trading direction, size, or urgency before matching.

## Why This Exists

Traditional DEX orderflow leaks intent before execution. Once a trade becomes visible in the mempool or a public orderbook, searchers can react before the user receives final settlement. ShadowSwap moves coordination into encrypted computation so matching happens before revelation, not after.

- Public orders leak trading direction, urgency, and often size before execution.
- Over $1.4B in MEV was extracted from Ethereum users in the past year.
- Standard privacy approaches often hide the trader, but not the market coordination itself.

## Why FHE Matters

If you want private matching, you must compute on encrypted data. Without FHE, intent has to be revealed to discover counterparties. With FHE, matching logic runs before the market sees the order. That ordering is the technical moat. ShadowSwap uses Fhenix CoFHE as the encrypted computation layer while the contracts live on Arbitrum Sepolia.

## Live Deployment

Network: `Arbitrum Sepolia`  
Chain ID: `421614`  
RPC: `https://sepolia-rollup.arbitrum.io/rpc`

| Contract | Address | Explorer |
| --- | --- | --- |
| `ShadowIntent` | `0x1B60D7b33deEA9345d0Df73316a97677b7D8b193` | https://sepolia.arbiscan.io/address/0x1B60D7b33deEA9345d0Df73316a97677b7D8b193 |
| `ShadowMatcher` | `0x1143fc8cC33316aA3E6F7CfC9E2b792461E6E9DD` | https://sepolia.arbiscan.io/address/0x1143fc8cC33316aA3E6F7CfC9E2b792461E6E9DD |
| `ShadowSettlement` | `0x80706cB2b54f5E584E7C7ebE618bB76c4E1c3b48` | https://sepolia.arbiscan.io/address/0x80706cB2b54f5E584E7C7ebE618bB76c4E1c3b48 |

Deployment artifacts are committed in:

- `deployments/addresses.json`
- `deployments/addresses.js`
- `frontend/public/addresses.json`

## Architecture

```text
User Intent
   -> [TFHE Encryption]
   -> [Encrypted Intent Storage]
   -> [FHE Matching Engine]
   -> [Proof Verification]
   -> [Minimal Settlement Reveal]
```

Frontend landing page includes a built-in architecture section and protocol flow visualization.

## Contracts

| Contract | Purpose |
| --- | --- |
| `ShadowIntent.sol` | Accepts encrypted intent inputs and stores encrypted amount, direction, and price limit. |
| `ShadowMatcher.sol` | Authorized matching entrypoint that marks intents matched and forwards settlement execution. |
| `ShadowSettlement.sol` | Records minimal public settlement output and supports trader-specific sealed reveal. |

## Local Setup

Root install:

```bash
npm install
```

Frontend install:

```bash
cd frontend
npm install
cd ..
```

Create env files:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Compile contracts:

```bash
npm run compile
```

Export frontend ABIs:

```bash
npm run export-abis
```

Deploy to Arbitrum Sepolia:

```bash
npm run deploy
```

Run the frontend locally:

```bash
cd frontend
npm run dev
```

Production build:

```bash
cd frontend
npm run build
```

## Frontend Notes

- `ShadowSwapApp` imports deployment addresses directly from `deployments/addresses.json`.
- The launch terminal uses real contract reads for network intent count and intent-status checks.
- The visualizer and live feed sections are explicitly labeled as simulated presentation telemetry, not live blockchain activity.

## Demo Flow

1. Connect MetaMask and switch to Arbitrum Sepolia.
2. Open the launch terminal and submit an encrypted intent.
3. Watch the transaction confirm and inspect the emitted intent ID.
4. Verify the network intent count and local intent ledger update from live contract reads.

## Screenshots

- `screenshots/landing-page.png` — add landing page capture before submission.
- `screenshots/launch-terminal.png` — add connected-wallet terminal view.
- `screenshots/intent-submitted.png` — add successful intent submission state.

## Verification Status

Completed locally:

- `npm install`
- `frontend npm install`
- `npm run compile`
- `npm run export-abis`
- `frontend npm run build`
- `npm run deploy` on Arbitrum Sepolia

Current known issue:

- The live Hardhat smoke-test task reaches the deployed network, but CoFHE node-side encryption currently fails under the local Node 18 runtime with an internal `cofhejs` SDK error after initialization fallback. Frontend submission flow remains wired for browser-side encryption, and the deployment itself is live.

## Submission Positioning

ShadowSwap is not trying to be a generic privacy wrapper. It targets the specific point where value is extracted from traders: market coordination before settlement. The protocol encrypts that coordination layer directly.

## Disclaimer

ShadowSwap is a hackathon prototype demonstrating FHE-based confidential market coordination architecture on Arbitrum Sepolia.

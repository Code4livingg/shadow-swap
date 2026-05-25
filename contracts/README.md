# ShadowSwap FHE Contracts

This folder contains a minimal three-contract private intent flow for ShadowSwap built around Fhenix encrypted value types and deployed on Arbitrum Sepolia.

## Contracts

`ShadowIntent.sol`
- Accepts encrypted trade intents.
- Stores `amount`, `direction`, and `priceLimit` as `euint32`, `euint8`, and `euint32`.
- Emits only `trader` and `intentId` on submission, so the public chain never sees size, side, or price limit in events.
- Restricts `markMatched` to the configured matcher contract.

`ShadowMatcher.sol`
- Acts as the matching engine entrypoint.
- Queues a public execution price computed off-chain, marks two intents as matched, and triggers settlement.
- Emits only the matched intent ids and timestamp.

`ShadowSettlement.sol`
- Stores settlement outcomes per intent with minimal public reveal.
- Publishes only the final execution price.
- Lets the original trader fetch a sealed handle for their own result through `sealedReveal`.

## Privacy Layers

The privacy model has three layers:

1. Intent inputs are submitted as encrypted FHE values, so order size, side, and price limit stay hidden on-chain.
2. Public events avoid leaking sensitive fields. Only ids, trader address, timestamps, and the final execution price are emitted.
3. Per-trader result access is permissioned. `sealedReveal` returns a handle that the trader can decrypt client-side with their Fhenix permit flow.

The contracts live on Arbitrum Sepolia, while Fhenix CoFHE acts as the coprocessor layer that enables encrypted computation. ShadowSwap does not depend on a separate Fhenix execution chain.

## FHE Operations Used

`TFHE.asEuint32` and `TFHE.asEuint8`
- Convert inbound encrypted inputs into stored encrypted state.
- Necessary because the contracts need to persist ciphertext handles rather than plaintext values.

`TFHE.allowThis`
- Grants the contract permission to keep operating on stored ciphertext.
- Necessary for later settlement and reveal flows.

`TFHE.allowSender`
- Grants the submitting trader access to their own ciphertext at submit time.
- Necessary so the user can still interact with their encrypted values from the client side.

`TFHE.sealoutput`
- Used in `ShadowSettlement.sealedReveal` to expose only the caller's own result handle.
- Necessary to preserve user-specific access instead of returning raw plaintext from the contract.

## Compatibility Note

This repo currently ships with the older `@fhenixprotocol/cofhe-contracts` package. A small compatibility shim is provided in `vendor/fhenix-contracts/TFHE.sol`, and `package.json` points `@fhenixprotocol/contracts` at that local package so the contracts can use the requested import path while remaining consistent with the installed toolchain.

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {TFHE} from "@fhenixprotocol/contracts/TFHE.sol";
import {euint8, euint32} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import {InEuint8, InEuint32} from "@fhenixprotocol/cofhe-contracts/ICofhe.sol";

contract ShadowIntent {
    struct EncryptedIntent {
        euint32 encryptedAmount;
        euint8 encryptedDirection;
        euint32 encryptedPriceLimit;
        address trader;
        uint256 timestamp;
        bool matched;
    }

    event IntentSubmitted(address indexed trader, uint256 indexed intentId);
    event IntentMatched(uint256 indexed intentId, uint256 timestamp);

    address public immutable matchingEngine;
    EncryptedIntent[] private intents;

    error OnlyMatchingEngine();
    error InvalidIntentId();

    modifier onlyMatchingEngine() {
        if (msg.sender != matchingEngine) {
            revert OnlyMatchingEngine();
        }
        _;
    }

    constructor(address matchingEngineAddress) {
        require(matchingEngineAddress != address(0), "matching engine required");
        matchingEngine = matchingEngineAddress;
    }

    function submitIntent(
        InEuint32 memory amount,
        InEuint8 memory direction,
        InEuint32 memory priceLimit
    ) public {
        euint32 encryptedAmount = TFHE.asEuint32(amount);
        euint8 encryptedDirection = TFHE.asEuint8(direction);
        euint32 encryptedPriceLimit = TFHE.asEuint32(priceLimit);

        TFHE.allowThis(encryptedAmount);
        TFHE.allowThis(encryptedDirection);
        TFHE.allowThis(encryptedPriceLimit);

        TFHE.allowSender(encryptedAmount);
        TFHE.allowSender(encryptedDirection);
        TFHE.allowSender(encryptedPriceLimit);

        intents.push(
            EncryptedIntent({
                encryptedAmount: encryptedAmount,
                encryptedDirection: encryptedDirection,
                encryptedPriceLimit: encryptedPriceLimit,
                trader: msg.sender,
                timestamp: block.timestamp,
                matched: false
            })
        );

        emit IntentSubmitted(msg.sender, intents.length - 1);
    }

    function getIntentCount() public view returns (uint256) {
        return intents.length;
    }

    function getIntentTrader(uint256 intentId) public view returns (address) {
        if (intentId >= intents.length) {
            revert InvalidIntentId();
        }

        return intents[intentId].trader;
    }

    function isMatched(uint256 intentId) public view returns (bool) {
        if (intentId >= intents.length) {
            revert InvalidIntentId();
        }

        return intents[intentId].matched;
    }

    function markMatched(uint256 intentId) external onlyMatchingEngine {
        if (intentId >= intents.length) {
            revert InvalidIntentId();
        }

        intents[intentId].matched = true;
        emit IntentMatched(intentId, block.timestamp);
    }
}

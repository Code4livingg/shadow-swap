// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {TFHE} from "@fhenixprotocol/contracts/TFHE.sol";
import {euint32} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import {IShadowIntent} from "./interfaces/IShadowIntent.sol";

contract ShadowSettlement {
    struct ExecutionResult {
        uint32 executionPrice;
        uint256 matchedAt;
        bool settled;
        euint32 sealedExecutionPrice;
    }

    event SettlementRecorded(
        uint256 indexed intentId1,
        uint256 indexed intentId2,
        uint32 executionPrice,
        uint256 timestamp
    );

    IShadowIntent public immutable shadowIntent;
    address public immutable matchingEngine;

    mapping(uint256 => ExecutionResult) private executionResults;

    error OnlyMatchingEngine();
    error UnauthorizedReveal();
    error ResultNotAvailable();

    modifier onlyMatchingEngine() {
        if (msg.sender != matchingEngine) {
            revert OnlyMatchingEngine();
        }
        _;
    }

    constructor(address shadowIntentAddress, address matchingEngineAddress) {
        require(shadowIntentAddress != address(0), "intent required");
        require(matchingEngineAddress != address(0), "matcher required");

        shadowIntent = IShadowIntent(shadowIntentAddress);
        matchingEngine = matchingEngineAddress;
    }

    function recordExecution(uint256 intentId1, uint256 intentId2, uint32 executionPrice) external onlyMatchingEngine {
        euint32 encryptedExecutionPrice = TFHE.asEuint32(uint256(executionPrice));
        TFHE.allowThis(encryptedExecutionPrice);

        executionResults[intentId1] = ExecutionResult({
            executionPrice: executionPrice,
            matchedAt: block.timestamp,
            settled: true,
            sealedExecutionPrice: encryptedExecutionPrice
        });

        executionResults[intentId2] = ExecutionResult({
            executionPrice: executionPrice,
            matchedAt: block.timestamp,
            settled: true,
            sealedExecutionPrice: encryptedExecutionPrice
        });

        emit SettlementRecorded(intentId1, intentId2, executionPrice, block.timestamp);
    }

    function getExecutionPrice(uint256 intentId) external view returns (uint32 executionPrice, bool settled) {
        ExecutionResult storage result = executionResults[intentId];
        return (result.executionPrice, result.settled);
    }

    function sealedReveal(uint256 intentId) external returns (uint256) {
        if (shadowIntent.getIntentTrader(intentId) != msg.sender) {
            revert UnauthorizedReveal();
        }

        ExecutionResult storage result = executionResults[intentId];
        if (!result.settled) {
            revert ResultNotAvailable();
        }

        return TFHE.sealoutput(result.sealedExecutionPrice);
    }
}

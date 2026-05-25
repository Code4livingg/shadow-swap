// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {IShadowIntent} from "./interfaces/IShadowIntent.sol";
import {IShadowSettlement} from "./interfaces/IShadowSettlement.sol";

contract ShadowMatcher {
    event MatchExecuted(uint256 indexed intentId1, uint256 indexed intentId2, uint256 timestamp);
    event ExecutionPriceQueued(uint32 executionPrice, uint256 timestamp);

    IShadowIntent public immutable shadowIntent;
    IShadowSettlement public immutable shadowSettlement;
    address public immutable operator;

    uint32 public queuedExecutionPrice;
    bool public hasQueuedExecutionPrice;

    error OnlyOperator();
    error MissingExecutionPrice();

    modifier onlyOperator() {
        if (msg.sender != operator) {
            revert OnlyOperator();
        }
        _;
    }

    constructor(address shadowIntentAddress, address shadowSettlementAddress) {
        require(shadowIntentAddress != address(0), "intent required");
        require(shadowSettlementAddress != address(0), "settlement required");

        shadowIntent = IShadowIntent(shadowIntentAddress);
        shadowSettlement = IShadowSettlement(shadowSettlementAddress);
        operator = msg.sender;
    }

    function queueExecutionPrice(uint32 executionPrice) external onlyOperator {
        queuedExecutionPrice = executionPrice;
        hasQueuedExecutionPrice = true;

        emit ExecutionPriceQueued(executionPrice, block.timestamp);
    }

    function executeSettlement(uint256 intentId1, uint256 intentId2) external onlyOperator {
        if (!hasQueuedExecutionPrice) {
            revert MissingExecutionPrice();
        }

        shadowIntent.markMatched(intentId1);
        shadowIntent.markMatched(intentId2);
        shadowSettlement.recordExecution(intentId1, intentId2, queuedExecutionPrice);

        hasQueuedExecutionPrice = false;
        emit MatchExecuted(intentId1, intentId2, block.timestamp);
    }
}

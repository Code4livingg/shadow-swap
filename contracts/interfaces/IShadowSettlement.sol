// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface IShadowSettlement {
    function recordExecution(uint256 intentId1, uint256 intentId2, uint32 executionPrice) external;
}

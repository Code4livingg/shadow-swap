// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface IShadowIntent {
    function markMatched(uint256 intentId) external;
    function getIntentTrader(uint256 intentId) external view returns (address);
}

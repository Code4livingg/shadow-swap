// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

contract ShadowSwap {
    struct Order {
        address trader;
        euint32 price;
        euint32 amount;
        bool isBuy;
    }

    struct BlindIntent {
        address user;
        bytes encryptedPayload;
        uint256 timestamp;
    }

    struct Match {
        uint256 intentA;
        uint256 intentB;
        uint256 timestamp;
    }

    Order[] private orders;
    BlindIntent[] public intents;
    Match[] public matches;

    event BlindIntentSubmitted(
        address indexed user,
        uint256 intentId
    );

    event IntentMatched(
        uint256 indexed intentA,
        uint256 indexed intentB
    );

    euint32 private ZERO;
    ebool private TRUE_VALUE;
    ebool private FALSE_VALUE;

    euint32 public highestBuyPrice;
    euint32 public highestBuyAmount;
    euint32 public highestBuyIndex;

    euint32 public highestSellPrice;
    euint32 public highestSellAmount;
    euint32 public highestSellIndex;

    ebool public hasBuyOrders;
    ebool public hasSellOrders;

    euint32 public winnerPrice;
    euint32 public winnerAmount;
    euint32 public winnerIndex;
    ebool public winnerIsBuy;

    bool public winnerDecryptRequested;
    bool public winnerRevealed;
    address public revealedWinnerTrader;
    uint256 public revealedWinnerPrice;
    uint256 public revealedWinnerAmount;
    bool public revealedWinnerIsBuy;

    constructor() {
        ZERO = FHE.asEuint32(0);
        TRUE_VALUE = FHE.asEbool(true);
        FALSE_VALUE = FHE.asEbool(false);

        FHE.allowThis(ZERO);
        FHE.allowThis(TRUE_VALUE);
        FHE.allowThis(FALSE_VALUE);
    }

    function submitOrder(InEuint32 memory price, InEuint32 memory amount, bool isBuy) external {
        euint32 encryptedPrice = FHE.asEuint32(price);
        euint32 encryptedAmount = FHE.asEuint32(amount);

        FHE.allowThis(encryptedPrice);
        FHE.allowThis(encryptedAmount);
        FHE.allowSender(encryptedPrice);
        FHE.allowSender(encryptedAmount);

        orders.push(
            Order({
                trader: msg.sender,
                price: encryptedPrice,
                amount: encryptedAmount,
                isBuy: isBuy
            })
        );
    }

    function submitIntent(bytes calldata encryptedIntent) external {
        intents.push(
            BlindIntent({
                user: msg.sender,
                encryptedPayload: encryptedIntent,
                timestamp: block.timestamp
            })
        );

        emit BlindIntentSubmitted(
            msg.sender,
            intents.length - 1
        );
    }

    function matchIntents(
        uint256 intentA,
        uint256 intentB
    ) external {
        require(intentA < intents.length);
        require(intentB < intents.length);

        matches.push(
            Match({
                intentA: intentA,
                intentB: intentB,
                timestamp: block.timestamp
            })
        );

        emit IntentMatched(intentA, intentB);
    }

    function autoMatch(
        uint256 intentA,
        uint256 intentB
    ) external {
        require(intentA < intents.length);
        require(intentB < intents.length);

        matches.push(
            Match({
                intentA: intentA,
                intentB: intentB,
                timestamp: block.timestamp
            })
        );

        emit IntentMatched(intentA, intentB);
    }

    function matchOrders() external {
        euint32 bestBuyPrice = ZERO;
        euint32 bestBuyAmount = ZERO;
        euint32 bestBuyIndexValue = ZERO;
        ebool buyFound = FALSE_VALUE;

        euint32 bestSellPrice = ZERO;
        euint32 bestSellAmount = ZERO;
        euint32 bestSellIndexValue = ZERO;
        ebool sellFound = FALSE_VALUE;

        for (uint32 i = 0; i < orders.length; i++) {
            Order storage order = orders[i];
            euint32 currentIndex = FHE.asEuint32(i);

            FHE.allowThis(currentIndex);

            if (order.isBuy) {
                ebool isBetterBuy = FHE.select(buyFound, FHE.gt(order.price, bestBuyPrice), TRUE_VALUE);
                bestBuyPrice = FHE.select(isBetterBuy, order.price, bestBuyPrice);
                bestBuyAmount = FHE.select(isBetterBuy, order.amount, bestBuyAmount);
                bestBuyIndexValue = FHE.select(isBetterBuy, currentIndex, bestBuyIndexValue);
                buyFound = TRUE_VALUE;

                FHE.allowThis(isBetterBuy);
                FHE.allowThis(bestBuyPrice);
                FHE.allowThis(bestBuyAmount);
                FHE.allowThis(bestBuyIndexValue);
            } else {
                ebool isBetterSell = FHE.select(sellFound, FHE.gt(order.price, bestSellPrice), TRUE_VALUE);
                bestSellPrice = FHE.select(isBetterSell, order.price, bestSellPrice);
                bestSellAmount = FHE.select(isBetterSell, order.amount, bestSellAmount);
                bestSellIndexValue = FHE.select(isBetterSell, currentIndex, bestSellIndexValue);
                sellFound = TRUE_VALUE;

                FHE.allowThis(isBetterSell);
                FHE.allowThis(bestSellPrice);
                FHE.allowThis(bestSellAmount);
                FHE.allowThis(bestSellIndexValue);
            }
        }

        highestBuyPrice = bestBuyPrice;
        highestBuyAmount = bestBuyAmount;
        highestBuyIndex = bestBuyIndexValue;
        hasBuyOrders = buyFound;

        highestSellPrice = bestSellPrice;
        highestSellAmount = bestSellAmount;
        highestSellIndex = bestSellIndexValue;
        hasSellOrders = sellFound;

        ebool buyWinsAgainstSell = FHE.select(sellFound, FHE.gt(bestBuyPrice, bestSellPrice), TRUE_VALUE);
        ebool selectedIsBuy = FHE.select(buyFound, buyWinsAgainstSell, FALSE_VALUE);

        winnerIsBuy = selectedIsBuy;
        winnerPrice = FHE.select(selectedIsBuy, bestBuyPrice, bestSellPrice);
        winnerAmount = FHE.select(selectedIsBuy, bestBuyAmount, bestSellAmount);
        winnerIndex = FHE.select(selectedIsBuy, bestBuyIndexValue, bestSellIndexValue);

        winnerDecryptRequested = false;
        winnerRevealed = false;
        revealedWinnerTrader = address(0);
        revealedWinnerPrice = 0;
        revealedWinnerAmount = 0;
        revealedWinnerIsBuy = false;

        FHE.allowThis(highestBuyPrice);
        FHE.allowThis(highestBuyAmount);
        FHE.allowThis(highestBuyIndex);
        FHE.allowThis(hasBuyOrders);
        FHE.allowThis(highestSellPrice);
        FHE.allowThis(highestSellAmount);
        FHE.allowThis(highestSellIndex);
        FHE.allowThis(hasSellOrders);
        FHE.allowThis(buyWinsAgainstSell);
        FHE.allowThis(winnerIsBuy);
        FHE.allowThis(winnerPrice);
        FHE.allowThis(winnerAmount);
        FHE.allowThis(winnerIndex);

        FHE.allowSender(highestBuyPrice);
        FHE.allowSender(highestBuyAmount);
        FHE.allowSender(highestBuyIndex);
        FHE.allowSender(hasBuyOrders);
        FHE.allowSender(highestSellPrice);
        FHE.allowSender(highestSellAmount);
        FHE.allowSender(highestSellIndex);
        FHE.allowSender(hasSellOrders);
        FHE.allowSender(winnerIsBuy);
        FHE.allowSender(winnerPrice);
        FHE.allowSender(winnerAmount);
        FHE.allowSender(winnerIndex);
    }

    function revealWinner() external {
        if (!winnerDecryptRequested) {
            FHE.decrypt(winnerIsBuy);
            FHE.decrypt(winnerPrice);
            FHE.decrypt(winnerAmount);
            FHE.decrypt(winnerIndex);
            winnerDecryptRequested = true;
            return;
        }

        (bool decryptedSide, bool sideReady) = FHE.getDecryptResultSafe(winnerIsBuy);
        (uint32 decryptedPrice, bool priceReady) = FHE.getDecryptResultSafe(winnerPrice);
        (uint32 decryptedAmount, bool amountReady) = FHE.getDecryptResultSafe(winnerAmount);
        (uint32 decryptedIndex, bool indexReady) = FHE.getDecryptResultSafe(winnerIndex);

        require(sideReady && priceReady && amountReady && indexReady, "Winner not ready");
        require(decryptedIndex < orders.length, "Invalid winner");

        Order storage winningOrder = orders[decryptedIndex];

        revealedWinnerTrader = winningOrder.trader;
        revealedWinnerPrice = decryptedPrice;
        revealedWinnerAmount = decryptedAmount;
        revealedWinnerIsBuy = decryptedSide;
        winnerRevealed = true;
    }

    function getOrderCount() external view returns (uint256) {
        return orders.length;
    }

    function getIntentCount() external view returns (uint256) {
        return intents.length;
    }
}

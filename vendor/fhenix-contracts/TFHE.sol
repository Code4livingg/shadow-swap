// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {
    FHE,
    euint8,
    euint32
} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import {InEuint8, InEuint32} from "@fhenixprotocol/cofhe-contracts/ICofhe.sol";

library TFHE {
    function asEuint8(uint256 value) internal returns (euint8) {
        return FHE.asEuint8(value);
    }

    function asEuint32(uint256 value) internal returns (euint32) {
        return FHE.asEuint32(value);
    }

    function asEuint8(InEuint8 memory value) internal returns (euint8) {
        return FHE.asEuint8(value);
    }

    function asEuint32(InEuint32 memory value) internal returns (euint32) {
        return FHE.asEuint32(value);
    }

    function allowThis(euint8 value) internal {
        FHE.allowThis(value);
    }

    function allowThis(euint32 value) internal {
        FHE.allowThis(value);
    }

    function allowSender(euint8 value) internal {
        FHE.allowSender(value);
    }

    function allowSender(euint32 value) internal {
        FHE.allowSender(value);
    }

    function sealoutput(euint32 value) internal returns (uint256) {
        FHE.allowThis(value);
        FHE.allowSender(value);
        return euint32.unwrap(value);
    }
}

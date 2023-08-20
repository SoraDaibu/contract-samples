// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

library EthTransfer {
    /**
     * @notice Transfer ETH. It is required to be successful.
     */
    function transferEth(address to, uint256 value) internal {
        (bool success,) = to.call{ value: value }(new bytes(0));
        require(success, "transfer failed");
    }
}

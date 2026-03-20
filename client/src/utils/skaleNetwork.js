// utils/skaleNetwork.js
// Reusable utility — adds & switches to SKALE Europa Hub Testnet
// Chain ID : 0x561bf78b (1444673419 decimal)
// RPC      : https://testnet.skalenodes.com/v1/juicy-low-small-testnet
// Explorer : https://juicy-low-small-testnet.explorer.testnet.skalenodes.com

// Single source of truth for the RPC URL — import this everywhere
// instead of hardcoding the URL in each file.
export const SKALE_RPC = "https://testnet.skalenodes.com/v1/juicy-low-small-testnet";

const SKALE_EUROPA_TESTNET = {
  chainId:         "0x561bf78b",
  chainName:       "SKALE Europa Hub Testnet",
  nativeCurrency:  { name: "sFUEL", symbol: "sFUEL", decimals: 18 },
  rpcUrls:         ["https://testnet.skalenodes.com/v1/juicy-low-small-testnet"],
  blockExplorerUrls: ["https://juicy-low-small-testnet.explorer.testnet.skalenodes.com"],
};

/**
 * Prompts MetaMask (or any EIP-1193 wallet) to:
 *   1. Switch to SKALE Europa Hub Testnet if already added.
 *   2. Add the network first, then switch, if not yet added.
 *
 * @param {object} provider  - raw EIP-1193 provider (walletProvider from AppKit)
 * @throws  Will throw if the user rejects the prompt.
 */
export async function switchToSkaleNetwork(provider) {
  if (!provider) throw new Error("No wallet provider available.");

  try {
    // Try switching first — succeeds if the network is already in the wallet
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SKALE_EUROPA_TESTNET.chainId }],
    });
  } catch (switchErr) {
    // Error code 4902 = chain not added yet → add it, then it auto-switches
    if (switchErr.code === 4902 || switchErr?.data?.originalError?.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [SKALE_EUROPA_TESTNET],
      });
    } else {
      // User rejected or other error — bubble up
      throw switchErr;
    }
  }
}
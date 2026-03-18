// wagmiConfig.js
import { createConfig, http } from "wagmi";
import { walletConnect, injected, coinbaseWallet } from "wagmi/connectors";
import { createWeb3Modal } from "@web3modal/wagmi";
import { defineChain } from "viem";

const projectId = "975943154ad55430a677c6366f2cc120";

// ✅ Custom chain para sa SKALE Europa
export const skaleEuropa = defineChain({
  id: 2046399126,
  name: "SKALE Europa",
  nativeCurrency: {
    decimals: 18,
    name: "sFUEL",
    symbol: "sFUEL",
  },
  rpcUrls: {
    default: {
      http: ["https://mainnet.skalenodes.com/v1/elated-tan-skat"],
    },
  },
  blockExplorers: {
    default: {
      name: "SKALE Explorer",
      url: "https://elated-tan-skat.explorer.mainnet.skalenodes.com",
    },
  },
});

export const config = createConfig({
  chains: [skaleEuropa],
  connectors: [
    injected(),
    walletConnect({ projectId }),
    coinbaseWallet({ appName: "Your App" }),
  ],
  transports: {
    [skaleEuropa.id]: http(),
  },
});

// ✅ Kailangan itong tawagin dito para ma-init ang modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
});
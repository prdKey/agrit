import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { UserProvider } from './context/UserContext.jsx'
import { BrowserRouter as Router } from "react-router-dom";
import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { defineChain } from "@reown/appkit/networks";

// 1. Get your Project ID from https://cloud.walletconnect.com
const projectId = "975943154ad55430a677c6366f2cc120";

// 2. SKALE Europa DeFi Hub Testnet
const skaleEuropaTestnet = defineChain({
  id: 1444673419,
  name: "SKALE Europa DeFi Hub Testnet",
  nativeCurrency: {
    name: "sFUEL",
    symbol: "sFUEL",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://juicy-low-small-testnet.skalenodes.com/v1"],
      webSocket: ["wss://juicy-low-small-testnet.skalenodes.com/v1/ws"],
    },
  },
  blockExplorers: {
    default: {
      name: "SKALE Explorer",
      url: "https://juicy-low-small-testnet.explorer.testnet.skalenodes.com",
    },
  },
  testnet: true,
});

// 3. Initialize AppKit
createAppKit({
  adapters: [new EthersAdapter()],
  networks: [skaleEuropaTestnet],
  projectId,
  metadata: {
    name: "Your App Name",
    description: "Your App Description",
    url: window.location.origin,
    icons: ["https://your-app.com/icon.png"],
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <UserProvider>
        <App />
      </UserProvider>
    </Router>
  </StrictMode>,
)
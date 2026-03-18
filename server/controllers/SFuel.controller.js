import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet   = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);

// Minimum sFUEL threshold — if below this, send more
const MIN_SFUEL = ethers.parseEther("0.00001");

// Amount to send per user
const SFUEL_AMOUNT = ethers.parseEther("0.001");

// POST /api/sfuel/distribute
// Call this on login or before any transaction
export const distributeSFuel = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    // Check current sFUEL balance
    const balance = await provider.getBalance(walletAddress);

    // Skip if already has enough
    if (balance >= MIN_SFUEL) {
      return res.json({ message: "Sufficient sFUEL balance", skipped: true });
    }

    // Send sFUEL from backend wallet
    const tx = await wallet.sendTransaction({
      to:    walletAddress,
      value: SFUEL_AMOUNT,
    });
    await tx.wait();

    res.json({
      message: "sFUEL distributed successfully",
      txHash:  tx.hash,
      amount:  ethers.formatEther(SFUEL_AMOUNT),
    });
  } catch (err) {
    console.error("sFUEL distribution error:", err);
    res.status(500).json({ error: err.message });
  }
};
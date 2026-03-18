import { tokenContract } from "../blockchain/contract.js";
import { ethers } from "ethers";

/* GET /api/tokens/total-supply */
export const getTotalSupply = async (req, res) => {
  try {
    const supply = await tokenContract.totalSupply();
    const formatted = ethers.formatEther(supply);
    res.json({ totalSupply: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* GET /api/tokens/balance/:address */
export const getBalance = async (req, res) => {
  try {
    const { address } = req.params;
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }
    const balance = await tokenContract.balanceOf(address);
    res.json({ address, balance: ethers.formatEther(balance) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* POST /api/tokens/mint — admin only */
export const mintTokens = async (req, res) => {
  try {
    const { to, amount } = req.body;
    if (!to || !amount) return res.status(400).json({ error: "to and amount are required" });
    if (!ethers.isAddress(to)) return res.status(400).json({ error: "Invalid wallet address" });
    if (isNaN(amount) || parseFloat(amount) <= 0) return res.status(400).json({ error: "Invalid amount" });

    const amountWei = ethers.parseEther(String(amount));
    const tx = await tokenContract.mint(to, amountWei);
    await tx.wait();

    res.json({ message: `Minted ${amount} AGT to ${to}`, txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* POST /api/tokens/transfer — admin wallet transfers */
export const transferTokens = async (req, res) => {
  try {
    const { to, amount } = req.body;
    if (!to || !amount) return res.status(400).json({ error: "to and amount are required" });
    if (!ethers.isAddress(to)) return res.status(400).json({ error: "Invalid wallet address" });
    if (isNaN(amount) || parseFloat(amount) <= 0) return res.status(400).json({ error: "Invalid amount" });

    const amountWei = ethers.parseEther(String(amount));
    const tx = await tokenContract.transfer(to, amountWei);
    await tx.wait();

    res.json({ message: `Transferred ${amount} AGT to ${to}`, txHash: tx.hash });
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: err.message });
  }
};
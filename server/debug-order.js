// debug-order.js — run with: node debug-order.js
// Simulates placeOrder with staticCall to get the exact revert reason

import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const RPC_URL               = process.env.RPC_URL;
const ORDER_MANAGER_ADDRESS = process.env.ORDER_MANAGER_CONTRACT_ADDRESS;
const PRODUCT_MANAGER_ADDRESS = process.env.PRODUCT_MANAGER_CONTRACT_ADDRESS;
const TOKEN_ADDRESS         = process.env.TOKEN_CONTRACT_ADDRESS;
const PRIVATE_KEY           = process.env.BACKEND_PRIVATE_KEY;
const BUYER_ADDRESS         = "0xa18E00de947eDD691e95ac2708Aa00a9d93Bc6Ee"; // the buyer

const ORDER_MANAGER_ABI = [
  "function placeOrder((uint256 productId, uint256 quantity, bool hasVariant, uint256 variantIndex)[] items, address buyerAddress) external returns (uint256)",
  "function orderCount() view returns (uint256)",
];

const PRODUCT_MANAGER_ABI = [
  "function getProduct(uint256 productId) view returns (tuple(uint256 id, address sellerAddress, string name, string imageCID, string category, uint256 pricePerUnit, uint256 stock, bool active, bool hasVariants))",
  "function getProductVariants(uint256 productId) view returns (tuple(string label, uint256 pricePerUnit, uint256 stock)[])",
];

const TOKEN_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
];

async function debug() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer   = new ethers.Wallet(PRIVATE_KEY, provider);

  const orderManager   = new ethers.Contract(ORDER_MANAGER_ADDRESS, ORDER_MANAGER_ABI, signer);
  const productManager = new ethers.Contract(PRODUCT_MANAGER_ADDRESS, PRODUCT_MANAGER_ABI, provider);
  const token          = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);

  console.log("=== DEBUG placeOrder ===\n");

  // 1. Check product exists
  console.log("1. Checking product #1...");
  try {
    const product = await productManager.getProduct(1);
    console.log("   Product:", {
      id: product.id.toString(),
      name: product.name,
      active: product.active,
      hasVariants: product.hasVariants,
      stock: product.stock.toString(),
      sellerAddress: product.sellerAddress,
    });

    if (product.hasVariants) {
      const variants = await productManager.getProductVariants(1);
      console.log("   Variants:");
      variants.forEach((v, i) => {
        console.log(`     [${i}] ${v.label} — price: ${ethers.formatEther(v.pricePerUnit)} AGT, stock: ${v.stock.toString()}`);
      });
    }
  } catch (e) {
    console.log("   ERROR getting product:", e.message);
  }

  // 2. Check buyer AGT balance
  console.log("\n2. Checking buyer AGT balance...");
  try {
    const balance   = await token.balanceOf(BUYER_ADDRESS);
    const allowance = await token.allowance(BUYER_ADDRESS, ORDER_MANAGER_ADDRESS);
    console.log("   Balance:", ethers.formatEther(balance), "AGT");
    console.log("   Allowance:", ethers.formatEther(allowance), "AGT");
  } catch (e) {
    console.log("   ERROR:", e.message);
  }

  // 3. Try staticCall to get revert reason
  console.log("\n3. Simulating placeOrder with staticCall...");
  const items = [
    { productId: 1, quantity: 1, hasVariant: true, variantIndex: 0 },
    { productId: 1, quantity: 1, hasVariant: true, variantIndex: 1 },
    { productId: 1, quantity: 2, hasVariant: true, variantIndex: 2 },
  ];

  try {
    const result = await orderManager.placeOrder.staticCall(items, BUYER_ADDRESS);
    console.log("   staticCall SUCCESS — orderId would be:", result.toString());
    console.log("   The transaction SHOULD work. Try sending it.");
  } catch (e) {
    console.log("   staticCall REVERT:", e.reason || e.message);
    if (e.data) console.log("   Revert data:", e.data);

    // Try to decode custom error
    const errorSelectors = {
      "0x8f4eb604": "InvalidQuantity()",
      "0x05ee9a98": "InactiveProduct()",
      "0x6b11b3db": "InsufficientStock()",
      "0x7939f424": "PaymentFailed()",
      "0x20b9a0a3": "BatchSellerMismatch()",
      "0x29c85742": "EmptyOrder()",
      "0x7f79b0fb": "InvalidVariant()",
    };
    if (e.data && errorSelectors[e.data.slice(0, 10)]) {
      console.log("   Decoded error:", errorSelectors[e.data.slice(0, 10)]);
    }
  }

  // 4. Check if OrderManager can call productManager
  console.log("\n4. Checking if OrderManager address matches what ProductManager expects...");
  console.log("   ORDER_MANAGER_ADDRESS:", ORDER_MANAGER_ADDRESS);
  console.log("   (Check your ProductManager for any onlyOrderManager modifier)");
}

debug().catch(console.error);
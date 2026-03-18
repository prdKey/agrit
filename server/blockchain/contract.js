import { ethers } from "ethers";
import dotenv from "dotenv";
import { PRODUCT_MANAGER_ABI } from "./product_manager_abi.js";
import { ORDER_MANAGER_ABI } from "./order_manager_abi.js";
import { CART_MANAGER_ABI } from "./cart_manager_abi.js";
import { TOKEN_ABI } from "./token_abi.js";

dotenv.config();

// Load ABI
const ABI = []

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);
console.log("Admin wallet:", wallet);

export const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  ABI,
  wallet 
);

export const productManagerContract = new ethers.Contract(
	process.env.PRODUCT_MANAGER_CONTRACT_ADDRESS,
	PRODUCT_MANAGER_ABI,
	wallet
)
export const orderManagerContract = new ethers.Contract(
	process.env.ORDER_MANAGER_CONTRACT_ADDRESS,
	ORDER_MANAGER_ABI,
	wallet
)

export const cartManagerContract = new ethers.Contract(
	process.env.CART_MANAGER_CONTRACT_ADDRESS,
	CART_MANAGER_ABI,
	wallet
)

export const tokenContract = new ethers.Contract(
	process.env.TOKEN_CONTRACT_ADDRESS,
	TOKEN_ABI,
	wallet
)

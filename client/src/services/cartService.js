import axios from "axios";
import { getToken } from "./tokenService.js";

const API_URL = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  Authorization: `Bearer ${getToken()}`,
});

/* Get all cart items for the logged-in user */
export const getCart = async () => {
  const res = await axios.get(`${API_URL}/carts`, { headers: authHeader() });
  return res.data.items ?? res.data;
};

/* Add an item to the cart.
   Pass sellerAddress (wallet address) so CheckoutPage can group items by
   seller and satisfy the contract's BatchSellerMismatch guard.
   Pass variantIndex + variantLabel when the product has variants. */
export const addToCart = async ({
  productId,
  quantity = 1,
  name,
  pricePerUnit,
  imageCID,
  category,
  stock,
  sellerAddress = null,   // FIX: was sellerId (DB id) — now wallet address
  variantIndex  = null,
  variantLabel  = null,
}) => {
  const res = await axios.post(
    `${API_URL}/carts`,
    {
      productId,
      quantity,
      name,
      pricePerUnit,
      imageCID,
      category,
      stock,
      sellerAddress: sellerAddress ?? null,
      variantIndex:  variantIndex  ?? null,
      variantLabel:  variantLabel  ?? null,
    },
    { headers: authHeader() }
  );
  return res.data;
};

/* Update the quantity of a cart item.
   Uses cart row id (not productId) — productId is not unique when variants exist. */
export const updateCartItem = async (cartId, quantity) => {
  const res = await axios.put(
    `${API_URL}/carts/${cartId}`,
    { quantity },
    { headers: authHeader() }
  );
  return res.data;
};

/* Remove a single cart item.
   Uses cart row id (not productId) — productId is not unique when variants exist. */
export const removeCartItem = async (cartId) => {
  const res = await axios.delete(`${API_URL}/carts/${cartId}`, {
    headers: authHeader(),
  });
  return res.data;
};

/* Clear the entire cart */
export const clearCart = async () => {
  const res = await axios.delete(`${API_URL}/carts/clear`, { headers: authHeader() });
  return res.data;
};

/* Remove a specific set of items after checkout.
   Accepts array of { productId, variantIndex } objects (preferred)
   or plain productId array (legacy). */
export const removeBulkCartItems = async (items) => {
  const productIds = items;
  const res = await axios.delete(`${API_URL}/carts/bulk`, {
    headers: authHeader(),
    data: { productIds },
  });
  return res.data;
};
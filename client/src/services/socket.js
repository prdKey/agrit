import { io } from "socket.io-client";

export const socket = io("https://agritrust.shop", {
  autoConnect: false, // connect manually
});
import express from "express";
import http from "http";
import { sequelize } from "./models/index.js";
import { initSocket } from "./config/socket.js";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

//Routes
import productRoute from "./routes/Product.route.js"
import authRoute from "./routes/Auth.route.js"
import userRoute from "./routes/User.route.js"
import orderRoute from "./routes/Order.route.js"
import cartRoute from "./routes/Cart.route.js"
import addressRoute from "./routes/Address.route.js"
import tokenRoute from "./routes/Token.route.js";
import sfuelRoute from "./routes/SFuel.route.js";
import ratingRoute from "./routes/Rating.route.js"
import notificationRoute from "./routes/Notification.route.js"
import walletRoute from "./routes/Wallet.route.js"
import flagRoute from "./routes/Flag.route.js"

const app = express();
const server = http.createServer(app);

app.use(cors(
  {
    origin: [
    "http://localhost:5173",
    "https://agritrust.shop",
  ],
  credentials: true,
  }
))

app.use(express.json());

app.use("/api/ratings", ratingRoute)
app.use("/api/flags", flagRoute)
app.use("/api/wallet", walletRoute)
app.use("/api/notifications", notificationRoute)
app.use("/api/addresses", addressRoute)
app.use("/api/sfuel", sfuelRoute);
app.use("/api/tokens", tokenRoute);
app.use("/api/products", productRoute)
app.use("/api/auth", authRoute)
app.use("/api/users", userRoute)
app.use("/api/orders", orderRoute)
app.use("/api/carts", cartRoute)

initSocket(server);

// Sync database & start server
sequelize.sync().then(() => {
  server.listen(3001, () => {
    console.log("Server running on port 3001");
  });
});

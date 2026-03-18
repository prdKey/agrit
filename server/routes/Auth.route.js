import express from "express"
import {getNonce, verifySignature} from "../controllers/Auth.controller.js";
const router = express.Router();

router.post("/nonce", getNonce);
router.post("/verify-signature", verifySignature)


export default router;
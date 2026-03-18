import User from "../models/User.model.js";
import { ethers } from "ethers";
import jwt from "jsonwebtoken";
import {contract} from "../blockchain/contract.js"

const generateNonce = () => Math.floor(Math.random() * 1000000).toString();


const nonces = {};

export const getNonce = async (req, res) =>
{
  try{
    const {walletAddress, firstName, lastName, email, mobileNumber, gender, dob, houseNumber, street, barangay, city, postalCode} = req.body;
    if (!walletAddress) return res.status(400).json({ message: "Wallet address required" });
    let user = await User.findOne({ where: { walletAddress } });
   
    if (!user) {
      if(!firstName || !lastName || !email || !mobileNumber || !gender || !dob || !houseNumber || !street || !barangay || !city || !postalCode ) return res.status(401).json({message: "Please register your wallet first!"});
      
      user = await User.create({
      walletAddress,
      lastName,
      firstName,
      email,
      mobileNumber: mobileNumber,
      gender,
      dob,
      address: {houseNumber, street, barangay, city, postalCode},
      });
    }

    const nonce = generateNonce();
    nonces[walletAddress] = nonce

    res.status(201).json({nonce})
  }catch (err){
    console.error(err);
    res.status(401).json({message: err.message})
  }
}

export const verifySignature = async (req, res) =>
{
  try{
    const {walletAddress, signature} = req.body;
    if (!walletAddress || !signature) return res.status(400).json({ error: "Missing data" });
    let user = await User.findOne({ where: { walletAddress } });

    const nonce = nonces[walletAddress];
    if (!nonce) return res.status(400).json({ error: "Nonce not found" });

    const message = `Sign this message to authenticate: ${nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({ error: "Signature verification failed" });
    }

    const token = jwt.sign({id: user.id, walletAddress, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    delete nonces[walletAddress];

    res.json({ user: {token: token, ...user.dataValues} });
  }catch (err) {
    res.status(401).json({message: err.message})
  }
}
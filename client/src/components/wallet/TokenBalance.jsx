import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../../context/WalletContext";
import { AGT_TOKEN_ADDRESS, AGT_ABI } from "../../utils/constants";


export default function TokenBalance() {
    const { provider, account } = useWallet();
    const [balance, setBalance] = useState("0");


    useEffect(() => {
        const loadBalance = async () => {
            if (!provider || !account) return;
            const contract = new ethers.Contract(AGT_TOKEN_ADDRESS, AGT_ABI, provider);
            const bal = await contract.balanceOf(account);
            setBalance(ethers.formatUnits(bal, 18));
        };
        loadBalance();
    }, [provider, account]);


    return <p className="text-sm">AGT Balance: {balance}</p>;
}
import axios from "axios";
const PINATA_TOKEN = import.meta.env.VITE_PINATA_TOKEN;

export const uploadImageToPinata = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS", // ✅ correct endpoint
      formData,
      {
        headers: {
          Authorization: `Bearer ${PINATA_TOKEN}`
        },
      }
    );

    const cid = res.data.IpfsHash; // this is your CID
    const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
    console.log("File uploaded:", url);
    return cid;
  } catch (err) {
    console.error("Error uploading to Pinata:", err);
    throw err;
  }
};

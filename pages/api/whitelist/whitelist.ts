import { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import ABI from '../../../constants/abi.json'
import { SUBSTREAM_CONTRACT } from '../../../constants/constants'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { address, extractedServerIds } = req.body;

  try {
    // Ensure the necessary data is present
    if (!address || !extractedServerIds) {
      return res.status(400).json({ error: 'Missing user address or discord server IDs' });
    }

    const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    const wallet = new ethers.Wallet(process.env.WHITELIST_PRIVATE_KEY ?? "", provider);

    const contract = new ethers.Contract(SUBSTREAM_CONTRACT, ABI, wallet);

    // Get gas price
    const gasPrice = await provider.getGasPrice();

    let tx;

    // Call the smart contract function
    try {
      // Call the smart contract function
      tx = await contract.addToWhitelist(address, extractedServerIds, { gasPrice: gasPrice });
    } catch (error) {
        console.error("Error sending transaction:", error);
        return res.status(500).json({ error: `Error sending transaction: ${error}` });
    }

    // Wait for the transaction to be mined
    try {
      // Wait for the transaction to be mined
      await tx.wait();
    } catch (error) {
        console.error("Error waiting for transaction:", error);
        return res.status(500).json({ error: `Error waiting for transaction: ${error}` });
    }

    console.log("ADDED TO WHITELIST")

    return res.status(200).json({ success: true, transactionHash: tx.hash });
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred while processing the request' });
  }
};

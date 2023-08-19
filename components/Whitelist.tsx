"use client"

import { ethers } from 'ethers';
import account from '../public/initialize.png'
import Image from 'next/image'
import { useEffect, useState } from 'react';
import { useUserContext } from './context/UserContext';

// Redeclare Discord Interface
interface Discord {
  id: string;
  serverName: string;
  owner: boolean;
}

type WhitelistProps = {
  address?: string
  discordServerIds: Discord[] | null;
};

export const Whitelist: React.FC<WhitelistProps> = ({ address, discordServerIds }) => {
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [propPopulated, setPropPopulated] = useState(false);

  const { setInitialized } = useUserContext()

  // Check for prop values if they're populated, update state accordingly
  useEffect(() => {
    if (address && Array.isArray(discordServerIds) && discordServerIds.length > 0) {
        setPropPopulated(true);
    } else {
        setPropPopulated(false);
    }
  }, [address, discordServerIds]);

  useEffect(() => {
    console.log(address);
    console.log(discordServerIds);
    const extractedServerIds = discordServerIds?.map(server => server.id);
    console.log(extractedServerIds);
  }, [address, discordServerIds]);
  
  const handleInitializing = async () => {
    try {
        const ethereumProvider = (window as any).ethereum;
        if (!ethereumProvider) {
            console.error("Ethereum provider not detected");
            return;
        }

        // Declare provider
        const provider = new ethers.providers.Web3Provider(ethereumProvider);
        const signer = provider.getSigner();

        // Message for signature
        const message = "Please sign this message to confirm your identity and server ownership.";
        const signature = await signer.signMessage(message);

        console.log('Signature:', signature);
        console.log(address)
        console.log(discordServerIds)

        // Extract server IDs from Discord object
        const extractedServerIds = discordServerIds?.map(server => server.id);
        console.log(extractedServerIds);

        // Send request to API to whitelist user
        const response = await fetch("/api/whitelist/whitelist", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ address, extractedServerIds })
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.log("error", responseData.error)
            throw new Error(responseData.error);
        }

        console.log("Response from backend:", responseData);

    } catch (error) {
      if (error instanceof Error) {
        if ('code' in error && error.code === 4001) { 
          setSignatureError("User canceled signature.");
        } else {
          setSignatureError("Couldn't Obatin Signature");
        }
      } else {
          setSignatureError("An unexpected error occured")
          console.log(new Error("An unexpected error occurred."));
      }
    }
  };

  return (
      <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-[400px] h-[300px] bg-white shadow-md rounded-20 py-8 px-4 flex flex-col justify-center items-center gap-12">
              <div className="flex flex-col gap-4 justify-center items-center">
                  <Image src={account} alt="Initialize Account" width={75} height={75} />
                  <div className="font-bold text-medium">Initialize Your Account</div>
              </div>
              <div className="flex flex-col gap-4 justify-center items-center">
                <button disabled={!propPopulated} onClick={handleInitializing}   className={`flex justify-center items-center border px-4 py-2 rounded-15 transition-all ${propPopulated ? 'border-1 hover:bg-green hover:border-green hover:text-white' : 'border-gray-300 cursor-not-allowed'}`}>
                    {propPopulated ? "Sign Message" : "Please Wait"}
                </button>
                <div className="text-red overflow-auto max-w-[200px]">
                  {signatureError}
                </div>
              </div>
          </div>
      </div>
  )
}
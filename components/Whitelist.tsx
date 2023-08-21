"use client"

import { ethers } from 'ethers';
import Image from 'next/image'
import account from '../public/initialize.png'
import success from '../public/success.png'
import { useEffect, useState } from 'react';
import { useUserContext } from './context/UserContext';

// Redeclare Discord Interface
interface Discord {
  id: string;
  name: string;
  owner: boolean;
}

type WhitelistProps = {
  address?: string
  discordServerIds: Discord[] | null;
};

export const Whitelist: React.FC<WhitelistProps> = ({ address, discordServerIds }) => {
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [propPopulated, setPropPopulated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { setInitialized } = useUserContext()

  // Check for prop values if they're populated, update state accordingly
  useEffect(() => {
    if (address && Array.isArray(discordServerIds) && discordServerIds.length > 0) {
        setPropPopulated(true);
    } else {
        setPropPopulated(false);
    }
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

        setIsLoading(true)

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

        setIsLoading(false)
        setIsSuccess(true)

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

  const closeModal = () => {
    setInitialized(true)
  }

  return (
      <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-[400px] h-[300px] bg-white shadow-md rounded-20 py-8 px-4 flex flex-col justify-center items-center gap-12">
              <div className="flex flex-col gap-4 justify-center items-center">
                {isSuccess ? 
                (
                  <div className="flex flex-col gap-8 justify-center items-center">
                    <Image src={success} width={75} height={75} alt="Account initialized" />
                    <div className="flex flex-col gap-4 justify-center items-center">
                      <div className="font-bold text-medium">You've been whitelisted 🎉!</div>
                      <button onClick={closeModal} className="max-w-[100px] py-2 px-4 bg-red text-white rounded-10">Close</button>
                    </div>
                  </div>
                )
                :
                (
                  <div className="flex flex-col gap-4 justify-center items-center ">
                    <div className="flex flex-col gap-8 justify-center items-center">
                      <Image src={account} alt="Initialize Account" width={75} height={75} />
                      <div className="font-bold text-medium">Initialize Your Account</div>
                    </div>
                    <button 
                      disabled={!propPopulated || isLoading}
                      onClick={handleInitializing}
                      className={`flex justify-center items-center border px-4 py-2 rounded-15 transition-all 
                          ${isLoading 
                              ? 'border-gray-300 cursor-not-allowed'
                              : propPopulated 
                                  ? 'border-1 hover:bg-green hover:border-green hover:text-white'
                                  : 'border-gray-300 cursor-not-allowed'}`}>
                      {isLoading ? "Transaction Submitted" : propPopulated ? "Sign Message" : "Please Wait"}
                    </button>
                  </div>
                )}
                <div className="text-red overflow-auto max-w-[200px]">
                  {signatureError}
                </div>
              </div>
          </div>
      </div>
  )
}
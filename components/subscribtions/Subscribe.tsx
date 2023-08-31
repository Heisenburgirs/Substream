import Image from 'next/image'
import discord from '../../public/discord.png'

import { SubscribeModal } from '../SubscribeModal';
import { useEffect, useState } from 'react';
import { TransactionAwaitingModal } from '../txModal/TransactionAwaitingModal';
import { TransactionSuccessModal } from '../txModal/TransactionSuccessModal';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { SUBSTREAM_NFT_CONTRACT } from '../../constants/constants';
import ABI from '../../constants/nft/abi.json'

interface SubscribeProps {
    name: string;
    discordServerId: string;
    paymentOptions: Record<string, any[]>;
}

interface TokenAttribute {
  serverId: string | number;
  token: string;
  flowRate: string | number;
  recipient: string;
}

interface SingleAttribute {
  trait_type: string;
  value: string | number;
}

type TokenData = {
  attributes: SingleAttribute[],
  subscriber: string,
  image: string,
};

export const Subscribe: React.FC<SubscribeProps> = ({ name, discordServerId, paymentOptions }) => {
  const { address, isConnected } = useAccount();

	const [isLoading, setIsLoading] = useState(false);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [serverId, setServerId] = useState<string | null>(null);
  const [hasPaymentOptions, setHasPaymentOptions] = useState<boolean>(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  const [imageLink, setImageLink] = useState<string>("");
  const [nftAttributes, setNftAttributes] = useState<TokenAttribute[]>([]);


  useEffect(() => {
    let isMounted = true; // To prevent state updates if the component is unmounted.

    async function checkSubscriptionStatus() {
      if (isConnected && isMounted) {
        const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const contract = new ethers.Contract(SUBSTREAM_NFT_CONTRACT, ABI, provider);

        const tokensOwned = await contract.tokensOfOwner(address);

        // Check if tokensOwned is empty
        if (tokensOwned.length === 0) {
          if (isMounted) {
            setIsSubscribed(false); 
          }
          return;  // Exit the function if no tokens are owned
        }

        let isUserSubscribed = false;
        for (const tokenId of tokensOwned) {
          const tokenUri = await contract.tokenURI(tokenId);
          const tokenDataResponse = await fetch(tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/')); // Convert ipfs URL to a fetchable URL
          const tokenData: TokenData = await tokenDataResponse.json();
          
          console.log(tokenData);

          // Extracting the serverId value from the attributes array
          const serverIdAttribute = tokenData.attributes.find(attr => attr.trait_type === "serverId");
          const serverIdValue = serverIdAttribute ? serverIdAttribute.value : null;

          console.log(serverIdValue);

          if (serverIdValue === discordServerId) {
              isUserSubscribed = true;
              setImageLink(tokenData.image);
              console.log("nah");

              
              const attributesObject: TokenAttribute = {
                serverId: serverIdValue,
                token: tokenData.attributes.find(attr => attr.trait_type === "token")?.value as string,
                flowRate: tokenData.attributes.find(attr => attr.trait_type === "flowRate")?.value || 0,
                recipient: tokenData.attributes.find(attr => attr.trait_type === "recipient")?.value as string
              };

              setNftAttributes([attributesObject]);
              setIsSubscribed(isUserSubscribed);
              break; // Break the loop if a match is found
          }

          // If loop completes and isUserSubscribed is still false, the user is no longer subscribed
          if (isMounted) {
              setIsSubscribed(isUserSubscribed);
          }
        }
      }
    }

    checkSubscriptionStatus();

    const interval = setInterval(() => { // Set interval to keep checking the subscription status.
      checkSubscriptionStatus();
    }, 2000); // Check every 2 seconds

    return () => {
      isMounted = false; // To prevent state updates if the component is unmounted.
      clearInterval(interval); // Cleanup on component unmount.
    };
  }, [isConnected, address, discordServerId]);
  
  const handleSubscribeClick = (serverId: string) => {
    setServerId(discordServerId); // Set the server ID when the button is clicked
    setIsSubscribeModalOpen(true); // Open the modal
  };

  // Callback function to update subscription status when flow is canceled
  const handleSubscriptionCanceled = () => {
    setIsSubscribed(false); // Update the subscription status
  };

  const handleFlowCreationStatus = (status: 'loading' | 'success' | 'error') => {
    if (status === 'loading') {
      setIsLoading(true);
    } else if (status === 'success') {
      setIsLoading(false);
      setIsSuccessVisible(true);
    } else if (status === 'error') { 
      setIsLoading(false);
    }
  } 
  
  const handleSuccessModalClose = () => {
    setIsSuccessVisible(false);
    setIsSubscribeModalOpen(false);
  }

  return (
    <div className="flex flex-col shadow-md gap-8 py-4 rounded-15 justify-center items-center py-4 px-8 ">
      <div className="flex flex-col justify-center items-center gap-4">
          <Image src={discord} width={150} height={150} alt="Discord server" />
          <div className="font-bold">{name}</div>
          <div className="max-w-[200px] max-h-[100px] text-center overflow-auto hide-scrollbar">
              Best programming discord server that you can find anywhere on Discord. Join now and get special perks
          </div>
      </div>
      <button onClick={() => handleSubscribeClick(name)} className="w-full shadow-md rounded-15 py-2 hover:bg-green-light transition transition-all">
        {isSubscribed ? "Manage" : "Subscribe"}</button>
      {isSuccessVisible ? (
        <TransactionSuccessModal isSuccessVisible={isSuccessVisible} onClose={handleSuccessModalClose} successMsg={"Subscribed"} />
      )
      :
      (
        <SubscribeModal 
          onClose={() => setIsSubscribeModalOpen(false)}
          isOpen={isSubscribeModalOpen}
          discordServerId={serverId}
          paymentOptions={paymentOptions}
          onFlowCreationStatus={handleFlowCreationStatus}
          onSubscriptionCanceled={handleSubscriptionCanceled}
          isSubscribed={isSubscribed}
          metadata={{
            image: imageLink,
            attributes: nftAttributes
          }}
        />
      )}
    </div>
  )
};
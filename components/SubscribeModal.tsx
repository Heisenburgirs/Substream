import { useEffect, useState } from "react";
import { useEthers } from "./context/EthersContext";
import { calculateFlowPerMonth, filterTokens, formatAddress, formatURI, formatURICID, getTokenSymbolByAddress, hexToDecimalString, roundToTwoDecimals } from "../utils/helpers";
import Image from 'next/image'
import link from '../public/link.png'
import superTokenList from '@superfluid-finance/tokenlist';
import { tokens, chains } from '../constants/constants'
import { createFlow, deleteFlow } from './functions/functions'
import { useAccount } from "wagmi";
import { useUserContext } from "./context/UserContext";
import { ethers } from "ethers";
import { SUBSTREAM_CONTRACT } from "../constants/constants";

import { useIPFS } from './context/IPFSContext';

interface TokenAttribute {
  serverId: string,
  token: string,
  flowRate: string,
  recipient: string
}

type SubscriptionCanceledCallback = () => void;

interface ModalProps {
  onClose: () => void;
  isOpen: boolean;
  discordServerId: string | null;
  paymentOptions: Record<string, any[]>;
  onFlowCreationStatus: (status: 'loading' | 'success' | 'error') => void;
  isSubscribed?: boolean;
  metadata?: { 
    image: string;
    attributes: TokenAttribute[];
  };
  onSubscriptionCanceled: SubscriptionCanceledCallback
}

interface Metadata {
  attributes: TokenAttribute[] | null;
  image: string | null;
}

export const SubscribeModal: React.FC<ModalProps & { discordServerId: string | null  }> = ({ onClose, isOpen, discordServerId, paymentOptions, onFlowCreationStatus, onSubscriptionCanceled, isSubscribed, metadata }) => {
  const { provider, contract, isBlockchainOperationInProgress } = useEthers();
  const [isLoading, setIsLoading] = useState<Record<number, boolean>>({});

  const { superSigner, framework} = useUserContext()
  
  const { address } = useAccount();

  const { client } = useIPFS();

  if (!isOpen) return null;
  
  const filteredTokensList = filterTokens(superTokenList.tokens, tokens, chains)

  const handleCreateFlow = async (option: any, index: number) => {
    //console.log("FRAMEOWKR", framework)

    if (discordServerId) { 
      const tokenAddress = option.incomingFlowToken;   
      const sender = address; 
      const receiver = option.recipient;
      const flowRate = option.requiredFlowRate.toString();
      const context = {
        finalRecipient: option.finalRecipient,
        discordId: discordServerId,
        bool: false
      };

      setIsLoading(prevLoading => ({ ...prevLoading, [index]: true }));

      const tokenData = {
        subscriber: sender,
        image: option.uri,
        attributes: [
            { trait_type: "serverId", value: discordServerId },
            { trait_type: "token", value: tokenAddress },
            { trait_type: "flowRate", value: roundToTwoDecimals(parseFloat(calculateFlowPerMonth(option.requiredFlowRate.toString()))).toString() },
            { trait_type: "recipient", value: option.finalRecipient }
        ]
      };

      if (client)

      try {
        const tokenURIResponse = await client.add(JSON.stringify(tokenData));
        const uri = "ipfs://" + tokenURIResponse.path;

        if (tokenAddress && sender && receiver && flowRate) {  // Check if all required parameters are defined
          try {
            const isSuccess = await createFlow(tokenAddress, uri, receiver, flowRate, context, framework, superSigner, provider, onFlowCreationStatus);
            if (isSuccess === true) {
                console.log("Flow created successfully!");
            } else {
                console.log("Failed to create flow."); 
            }
            setIsLoading(prevLoading => ({ ...prevLoading, [index]: false }));
          } catch (error) {
            const err = error as Error;
            console.error("Error:", err.message);
            setIsLoading(prevLoading => ({ ...prevLoading, [index]: false }));
          }
      
        } else {
            console.error("One or more parameters are not defined.");
            setIsLoading(prevLoading => ({ ...prevLoading, [index]: false }));
        }

      } catch (error) {
          console.error("Failed to upload to IPFS", error);
          setIsLoading(prevLoading => ({ ...prevLoading, [index]: false }));

      }
    }
  }

  const test = () => {
    console.log(metadata)
    //console.log(metadata?.attributes?.[3].value)
    //console.log("ACTIVE", activeSubscription?.attributes?.[3].value)
  }
  
  const getFlowRate = async (sender: string, substream: string) => {
    const fdaix = await framework.loadSuperToken("fDAIx");

    const userFlow = await fdaix.getFlow({
        sender: sender,
        receiver: substream,
        providerOrSigner: provider,
    });

    console.log("Flow rate:", userFlow.flowRate);
    return userFlow.flowRate;
  }

  const handleCancelFlow = async () => {
    if (!metadata) return;

    if (discordServerId) {
        const tokenAddress = metadata?.attributes[0].token;
        const sender = address;
        const receiver = SUBSTREAM_CONTRACT;

        if (address){
          const flowRate = await getFlowRate(address, receiver);;  // Setting flowRate to 0 to cancel the stream.
          const context = {
              finalRecipient: metadata?.attributes[0].recipient,
              discordId: discordServerId,
              bool: true
          };  

          setIsLoading(prevLoading => ({ ...prevLoading, [0]: true }));

          if (tokenAddress && sender && receiver && flowRate) {
              try {
                  const isSuccess = await deleteFlow(tokenAddress, "", receiver, flowRate, context, framework, superSigner, provider, onFlowCreationStatus);
                  if (isSuccess) {
                      console.log("Flow cancelled successfully!");
                      onSubscriptionCanceled();
                  } else {
                      console.log("Failed to cancel flow.");
                  }
                  setIsLoading(prevLoading => ({ ...prevLoading, [0]: false }));
              } catch (error) {
                  const err = error as Error;
                  console.error("Error:", err.message);
                  setIsLoading(prevLoading => ({ ...prevLoading, [0]: false }));
              }
          } else {
              console.error("One or more parameters are not defined.");
              setIsLoading(prevLoading => ({ ...prevLoading, [0]: false }));
          }
        }
    }
  }

  return(
    <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="flex flex-col bg-white rounded-20 py-4 px-8 gap-4 w-[400px] max-h-[800px] overflow-auto ">
        {isSubscribed ? (
          <div className="border border-black border-opacity-20 py-2 px-4 rounded-20">
            {metadata?.image && (
              <Image src={metadata.image} width={1000} height={1000} className="w-full mb-4 rounded-20" alt="NFT Image" />
            )}

            {metadata?.attributes?.[0] && (
              <div className="flex flex-col gap-4 mt-8">
                <div className="flex justify-between">
                    <span className="text-xsmall opacity-75">Server ID:</span>
                    <span>{metadata.attributes[0].serverId}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-xsmall opacity-75">Flow Rate:</span>
                    <span>{metadata.attributes[0].flowRate}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-xsmall opacity-75">Recipient:</span>
                    <span>{formatAddress(metadata.attributes[0].recipient)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-xsmall opacity-75">Token:</span>
                    <span>{getTokenSymbolByAddress(metadata.attributes[0].token, filteredTokensList)}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>  
          {discordServerId &&
            paymentOptions[discordServerId] &&
            paymentOptions[discordServerId].map((option, index) => (
              <div className="flex flex-col gap-2 p-4 border border-black border-opacity-20 rounded-15">
                <div className="flex justify-between">
                  <span className="text-xsmall opacity-75">Token</span>
                  <div>
                    {getTokenSymbolByAddress(option.incomingFlowToken, filteredTokensList)}
                  </div>
                </div>
                <div className="flex justify-between"> 
                  <span className="text-xsmall opacity-75">Recipient</span>
                  <div>
                    {formatAddress(option.finalRecipient)}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-xsmall opacity-75">Flow Rate</span>
                  <div>
                    {roundToTwoDecimals(parseFloat(calculateFlowPerMonth(hexToDecimalString(option.requiredFlowRate))))} / month
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-xsmall opacity-75">URI</span>
                  <a href={`https://ipfs.io/ipfs/${formatURICID(option.uri)}`} target="_blank" className="flex gap-2 items-center">
                    {formatURI(option.uri)}
                    <Image src={link} width={10} height={10} className="h-[12px] mt-[2px]" alt="IPFS Link" />
                  </a>
                </div>
                <div  
                  onClick={isLoading[index] ? undefined : () => handleCreateFlow(option, index)} 
                  className={`flex justify-center border border-black border-opacity-20 rounded-15 items-center py-2 ${isLoading[index] ? 'opacity-75 pointer-events-none' : 'hover:bg-green hover:border-green hover:text-white cursor-pointer'} transition`}
                >
                  {isLoading[index] ? "Loading..." : "Subscribe"}
                </div>
              </div>
            ))}
          </>
        )}
        {isSubscribed && <div onClick={handleCancelFlow} className="flex text-white rounded-10 justify-center bg-red hover:text-white hover:border-red cursor-pointer hover:shadow-md hover:shadow-red py-2 transition">Cancel Subscription</div>}
        <div onClick={onClose} className="flex border border-black border-opacity-20 rounded-10 justify-center hover:text-white hover:bg-red hover:border-red cursor-pointer py-2 transition">Close</div>
      </div>
    </div>
  ) 
}
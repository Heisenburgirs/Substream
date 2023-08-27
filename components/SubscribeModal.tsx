import { useEffect, useState } from "react";
import { useEthers } from "./context/EthersContext";
import { calculateFlowPerMonth, filterTokens, formatAddress, formatURI, formatURICID, getTokenSymbolByAddress, hexToDecimalString, roundToTwoDecimals } from "../utils/helpers";
import Image from 'next/image'
import link from '../public/link.png'
import superTokenList from '@superfluid-finance/tokenlist';
import { tokens, chains } from '../constants/constants'

interface ModalProps {
    onClose: () => void;
    isOpen: boolean;
    discordServerId: string | null;
    paymentOptions: Record<string, any[]>;
  }

export const SubscribeModal: React.FC<ModalProps & { discordServerId: string | null }> = ({ onClose, isOpen, discordServerId, paymentOptions }) => {
  const { contract, isBlockchainOperationInProgress } = useEthers();

  useEffect(() => {
    if (isOpen && discordServerId) {
      console.log("Selected server ID:", discordServerId);
    }
  }, [isOpen, discordServerId]);

  /*useEffect(() => {
    if (isBlockchainOperationInProgress) return;

    const queryPaymentOptions = async () => {
      const paymentOptionsByServer: { [key: string]: any[] } = {};

      if (discordServerId) {
        for (const serverId of discordServerId) {
          const options = await contract?.getPaymentOptionsByDiscordId(serverId);
          paymentOptionsByServer[serverId] = options;
        }
      }

      setPaymentOptions(paymentOptionsByServer);
      console.log(paymentOptionsByServer);
    };

    queryPaymentOptions();
  }, [discordServerId, isBlockchainOperationInProgress]);*/

  if (!isOpen) return null;

  const test = () => {
    console.log(paymentOptions)
  }
  
  const filteredTokensList = filterTokens(superTokenList.tokens, tokens, chains)

  return(
    <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="flex flex-col bg-white rounded-20 py-4 px-8 gap-4 w-[400px] max-h-[800px] overflow-auto ">
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
              <div className="flex justify-center border border-black border-opacity-20 rounded-15 items-center py-2 hover:bg-green hover:border-green hover:text-white cursor-pointer transition">Subscribe</div>
            </div>
        ))}
        <div onClick={onClose} className="flex border border-black border-opacity-20 rounded-10 justify-center hover:text-white hover:bg-red hover:border-red cursor-pointer py-2 transition">Close</div>
      </div>
    </div>
  )
}
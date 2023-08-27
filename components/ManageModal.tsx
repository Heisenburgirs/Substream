import React, { useState, useEffect } from 'react';
import Image from 'next/image'
import link from '../public/link.png'
import loading2 from '../public/loading2.gif'
import { hexToDecimalString, filterTokens, getTokenSymbolByAddress, formatAddress, formatURICID, formatURI, calculateFlowPerMonth, roundToTwoDecimals } from '../utils/helpers'
import { tokens, chains } from '../constants/constants'
import superTokenList from '@superfluid-finance/tokenlist';
import { deletePaymentOptions } from './functions/functions';
import { useEthers } from './context/EthersContext';
import { EditModal } from './EditModal';

interface ModalProps {
  onClose: () => void;
  discordServerId: string;
  isOpen: boolean;
  paymentOptions: Record<string, any[]>;
}

export const ManageModal: React.FC<ModalProps> = ({ onClose, discordServerId, isOpen, paymentOptions }) => {
  if (!isOpen) return null;

  // Display Edit Modal if true, save selected payment method as constant
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<null | any>(null);


  const { provider, contract } = useEthers();
  
  const filteredTokensList = filterTokens(superTokenList.tokens, tokens, chains)

  const [paymentOptionsExtracted, setExtracted] = useState<any[]>([]);
  const [isAwaitVisible, setAwaitVisible] = useState(false);
  const [isLoading, setIsLoading] = useState<Record<number, boolean>>({});
  const { setIsBlockchainOperationInProgress } = useEthers();
  const [selectedPaymentOptionIndex, setSelectedPaymentOptionIndex] = useState<number | null>(null);

  useEffect(() => {
    const currentPaymentOptions = paymentOptions[discordServerId];

    // Map over currentPaymentOptions to extract values
    const extractedOptions = currentPaymentOptions.map(option => ({
      incomingFlowToken: option.incomingFlowToken,
      finalRecipient: option.finalRecipient,
      requiredFlowRate: option.requiredFlowRate?._hex,
      uri: option.uri
    }));

    setExtracted(extractedOptions);
  }, [discordServerId, paymentOptions]);

  const handleDeleteOptions = async (index: number) => {
    setIsLoading(prevLoading => ({ ...prevLoading, [index]: true }));
    if (setIsBlockchainOperationInProgress) {
      setIsBlockchainOperationInProgress(true);
    }

    //console.log(index)
  
    const result = await deletePaymentOptions(discordServerId, [index], contract, provider, setAwaitVisible);
  
    if (result.success) {
      if (setIsBlockchainOperationInProgress) {
      setIsBlockchainOperationInProgress(false);
      }

      setIsLoading(prevLoading => ({ ...prevLoading, [index]: false }));
      const updatedPaymentOptions = [...paymentOptionsExtracted];
      updatedPaymentOptions.splice(index, 1);
      setExtracted(updatedPaymentOptions);
      console.log("test", paymentOptionsExtracted)
      console.log("test2", updatedPaymentOptions)

      if (updatedPaymentOptions.length === 0) {
        onClose();
      }
    } else if (result.error) {
      setIsLoading(prevLoading => ({ ...prevLoading, [index]: false }));
      setAwaitVisible(false);
      if (setIsBlockchainOperationInProgress) {
      setIsBlockchainOperationInProgress(false);
      }  
    }
  };

  const test = () =>{
    console.log()
  }
  
  const handleEditOptions = (index: number) => {
    if (index != null) {  // Checking if index is not null or undefined.
        console.log("Editing payment option at index:", index);
        setSelectedPaymentOptionIndex(index);
    } else {
        console.error("Error: Index is null or undefined.");
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="flex flex-col bg-white rounded-20 py-4 px-8 gap-4 w-[400px] max-h-[800px] overflow-auto ">
      {isUpdatingPayment ? (
                <EditModal 
                    paymentOption={selectedPaymentOption}
                    isOpen={isUpdatingPayment}
                    onClose={() => setIsUpdatingPayment(false)} 
                    onUpdate={(updatedOption) => {
                        setIsUpdatingPayment(false);
                    }}
                    discordServerId={discordServerId}
                    filteredTokensList={filteredTokensList}
                    index={selectedPaymentOptionIndex!}
                />
            ) : (
              <>
                {paymentOptionsExtracted.map((option, index) => (
                  <div key={index} className="flex flex-col w-full gap-6 text-small border border-black border-opacity-20 rounded-15 p-4">
                    <div className="flex flex-col gap-2">
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
                    </div>
                    <div className="flex justify-between">
                      <button
                        className={`py-2 px-4 border border-black border-opacity-20 rounded-15 cursor-pointer hover:bg-blue hover:text-white hover:border-blue transition`}
                        onClick={() => {
                          setSelectedPaymentOption(option);
                          setIsUpdatingPayment(true);
                          handleEditOptions(index);
                        }}
                        disabled={isLoading[index]}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteOptions(index)}
                        className={`flex items-center gap-2 py-2 px-4 border border-black border-opacity-20 rounded-15 cursor-pointer hover:bg-red hover:text-white hover:border-opacity-0 transition-all`}
                        disabled={isLoading[index]}
                      >
                        {isLoading[index] && <Image src={loading2} width={12} height={12} alt="Loading" />}
                        {isLoading[index] ? (isAwaitVisible ? 'Deleting' : 'Confirm') : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex rounded-10 bg-red justify-center items-center py-2 text-white cursor-pointer" onClick={onClose}>
                  Close
                </div>
              </>
              )}
      </div>
    </div>
  );
}
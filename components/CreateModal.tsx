import React, { useRef, useState, ChangeEvent, useEffect } from 'react';
import { create } from "ipfs-http-client";
import superTokenList from '@superfluid-finance/tokenlist';
import { ethers } from 'ethers'
import bin from '../public/bin.png';
import Image from 'next/image';
import link from '../public/link.png'
import loading2 from '../public/loading2.gif'

import { TransactionAwaitingModal } from './txModal/TransactionAwaitingModal';
import { TransactionSuccessModal } from './txModal/TransactionSuccessModal';

import { chains, tokens, flowRateDate } from '../constants/constants'

import {
  FormData,
  hexToDecimalString,
  calculateFlowPerSecond,
  isValidEthereumAddress,
  filterTokens,
  getTokenSymbolByAddress,
  formatAddress,
  formatURI,
  formatURICID,
  clearFields,
  removeFromList,
  validateForm,
  addToListAndReset,
  createHandleFormChange
} from '../utils/helpers'

import { useIPFS } from './context/IPFSContext';

import { CreateOrAddPaymentOptions } from './functions/functions';
import { useEthers } from './context/EthersContext';

interface ModalProps {
    onClose: () => void;
    discordServerId: string;
    isOpen: boolean;
}

declare global {
  interface Window {
    ethereum: any;
  }
}

export const CreateModal: React.FC<ModalProps> = ({ onClose, discordServerId, isOpen }) => {
  if (!isOpen) return null;

  const { client } = useIPFS();

  const { provider, contract } = useEthers();

  const [isUploading, setIsUploading] = useState(false);
  const [isAwaitVisible, setAwaitVisible] = useState(false);
  const [isSuccessVisible, setSuccessVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const filteredTokensList = filterTokens(superTokenList.tokens, tokens, chains)

  const initialFormState = {
    incomingToken: filteredTokensList[0].address,
    flowRate: '',
    discordServerId,
    finalRecipient: '',
    uri: ''
  };

  const [form, setForm] = useState<FormData>(initialFormState);
  const [addedForms, setAddedForms] = useState<FormData[]>([]);
  const [invalidFields, setInvalidFields] = useState<(keyof FormData)[]>([]);
  
  // This function handles the file upload, pins to IPFS and sets the URL to form
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setIsUploading(true)
      try {
          const addedFile = await client?.add(file);
          const ipfsUrl = `https://ipfs.infura.io/ipfs/${addedFile?.path}`;
          handleFormChange('uri', ipfsUrl);
          setIsUploading(false)
      } catch (error) {
          console.error("Error uploading file to IPFS:", error);
          setIsUploading(false)
      }
    }
  };

  // Handles form input field changes
  const handleFormChange = createHandleFormChange<FormData>(setForm, setInvalidFields);

  // Adds payment option to list
  const addFormToList = () => {
    const incompleteFields = validateForm(form);
    
    if (incompleteFields.length > 0) {
      setInvalidFields(incompleteFields);
      return;
    }
    
    const updatedForms = addToListAndReset(addedForms, form, initialFormState);
    setAddedForms(updatedForms);
    setForm(initialFormState);
  };

  const getInputBorderColor = (field: keyof FormData) => {
    return invalidFields.includes(field) ? 'border border-red border-opacity-80' : 'border-black border-opacity-30';
  };

  // Removes payment option from list
  const removeFormFromList = (index: number) => {
    const updatedForms = removeFromList(addedForms, index);
    setAddedForms(updatedForms);
  };

  // Clears fields dynamically
  const clearField: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const field = e.currentTarget.getAttribute("data-field") as keyof FormData;
    if (field) {
        clearFields([field], handleFormChange);
    }
  };

  // Creates/Adds payment option(s)
  const onSubmit = async () => {
    setIsLoading(true)

    // Adjust the flow rate and NFT uri lnik for each item in addedForms
    const adjustedForms = addedForms.map(form => {
      const adjustedFlowRate = calculateFlowPerSecond(form.flowRate);

      // Replace the URI's hostname
      const adjustedUri = form.uri.replace("https://ipfs.infura.io/ipfs/", "https://ipfs.io/ipfs/");

      return { 
        ...form, 
        flowRate: adjustedFlowRate.toString(),
        uri: adjustedUri // replace the old URI with the adjusted one
      };
    });

    console.log(adjustedForms)

    const result = await CreateOrAddPaymentOptions(adjustedForms, provider, contract, setAwaitVisible);
    setAwaitVisible

    if (result.success) {
      setSuccessVisible(true);
      setAwaitVisible(false);
      setIsLoading(false)
    } else if (result.error) {
      setAwaitVisible(false);
      setIsLoading(false)
    }
  }

  return (
      <>
        {isSuccessVisible ? (
            <TransactionSuccessModal isSuccessVisible={isSuccessVisible} onClose={onClose} successMsg={"Payment Options Created"} />
        ) : isAwaitVisible ? (
            <TransactionAwaitingModal isAwaitVisible={isAwaitVisible} />
        ) : (
          <>
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="flex flex-col w-[1000px] bg-white p-6 rounded-20 gap-8">
          <div className="flex gap-8">
          {/* Left side: Form Input */} 
          <div className="flex flex-col gap-4 w-1/2">
            <div className="text-medium font-bold">Create Subscription</div>
            <div className="flex flex-col gap-2 text-small">
              {/* Discord ID */}
              <div className="flex flex-col gap-2">
                <label className="">Discord ID</label>
                <input type="text" className="border border-black border-opacity-50 rounded-5 py-2 px-4 cursor-default outline-none opacity-50" value={form.discordServerId} readOnly />
              </div>
              {/* Flow Token */}
              <div className="flex flex-col gap-2">
                <label className="">Flow Token</label>
                <div className="flex items-center gap-4">
                  <select 
                    value={form.incomingToken}
                    onChange={e => handleFormChange('incomingToken', e.target.value)}
                    className={`w-full border rounded-5 py-2 px-4 ${getInputBorderColor('incomingToken')} outline-green`}
                  >
                    {tokens.map(tokens => (
                      <option key={tokens} value={tokens}>{tokens}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Flow Rate */}
              <div className="flex flex-col gap-2">
                <label className="">Flow Rate</label>
                <div className="flex items-center gap-4">
                  <input
                    className={`w-full border rounded-5 py-2 px-4 ${getInputBorderColor('flowRate')} outline-green`}
                    type="number"
                    placeholder="Per month"
                    value={form.flowRate} 
                    onChange={e => handleFormChange('flowRate', e.target.value)} 
                  />
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                        {flowRateDate.map(flowRateDate => (
                          <option key={flowRateDate} value={flowRateDate}>{flowRateDate}</option>
                        ))}
                    </div>
                  </div>
                  <div onClick={clearField} data-field="flowRate" className="cursor-pointer w-[30px] flex justify-end">
                      <Image src={bin} width={18} height={18} alt="clean field" />
                  </div>
                </div>
              </div>
              {/* Final Recipient */}
              <div className="flex flex-col gap-2">
                <label className="">Final Recipient</label>
                <div className="flex items-center gap-4">
                  <input 
                    className={`w-full border rounded-5 py-2 px-4 ${getInputBorderColor('finalRecipient')} outline-green`}
                    type="text"
                    placeholder="Enter final recipient"
                    value={form.finalRecipient}
                    onChange={e => handleFormChange('finalRecipient', e.target.value)} 
                  />
                  <div onClick={clearField} data-field="finalRecipient" className="cursor-pointer">
                    <Image src={bin} width={18} height={18} alt="clean field" />
                  </div>
                </div>
                {!isValidEthereumAddress(form.finalRecipient) && form.finalRecipient !== "" && 
                  <p className="text-red-500">Please enter a valid Ethereum address.</p>}
              </div>
              {/* URI */}
              <div className="flex flex-col gap-2">
                <label className="">Upload NFT</label>
                {
                  form.uri === '' 
                    ? ( 
                        isUploading 
                          ? <input
                              className={`border border-black border-opacity-30 rounded-5 py-2 px-4 opacity-50 cursor-default outline-none ${getInputBorderColor('uri')}`}
                              type="text"
                              value="Uploading..."
                              readOnly
                            />
                          : <input
                              type="file"
                              accept="image/*"
                              placeholder="Add File +"
                              onChange={handleFileUpload}
                              className={`border border-black border-opacity-30 rounded-5 py-2 px-4 ${getInputBorderColor('uri')} outline-green`}
                            />
                      )
                    : 
                      <div className="flex items-center gap-4">
                        <input
                            className={`w-full border border-black border-opacity-30 rounded-5 py-2 px-4 ${getInputBorderColor('uri')} outline-none cursor-default`}
                            type="text"
                            placeholder="Add image"
                            value={form.uri}
                            readOnly
                          />
                        <div onClick={clearField} data-field="uri" className="cursor-pointer">
                          <Image src={bin} width={18} height={18} alt="clean field" />
                        </div>
                      </div>
                }
              </div>
              <button onClick={addFormToList} className="border border-black border-opacity-30 font-bold rounded-5 py-2 mt-4">Add +</button>
              {/*<div onClick={test}>test</div>*/}
            </div>
          </div>

          {/* Right side: Added Payment Options List */}
          <div className="flex flex-col gap-4 w-1/2 pl-4 max-h-[530px] overflow-auto  ">
            <h2 className="text-medium font-bold">Payment Details Summary</h2>
            {addedForms.length === 0 ? (
                <div className="mt-8 flex bg-red bg-opacity-20 rounded-10 h-[42px] px-4 justify-center items-center text-red">Plase add at least one payment option</div>
            ) : (
                addedForms.map((item, index) => (
                    <div key={index} className="flex flex-col gap-2 text-small border border-black border-opacity-20 rounded-15 p-4">
                      <div className="flex justify-between">
                          <div className="text-xsmall opacity-75">Token</div>
                          <div>{getTokenSymbolByAddress(item.incomingToken, superTokenList.tokens)}</div>
                      </div> 
                      <div className="flex justify-between">
                          <div className="text-xsmall opacity-75">Flow Rate</div>
                          <div>{item.flowRate} / month</div>
                      </div>
                      <div className="flex justify-between">
                          <div className="text-xsmall opacity-75">Discord ID</div>
                          <div>{item.discordServerId}</div>
                      </div>
                      <div className="flex justify-between">
                          <div className="text-xsmall opacity-75">Final Recipient:</div>
                          <div>{formatAddress(item.finalRecipient)}</div>
                      </div>
                      <div className="flex justify-between">
                          <div className="text-xsmall opacity-75">NFT</div>

                          <a href={`https://ipfs.io/ipfs/${formatURICID(item.uri)}`} target="_blank" className="flex gap-2 items-center">
                            <div >{formatURI(item.uri)}</div>
                            <Image src={link} width={10} height={10} className="h-[12px] mt-[2px]" alt="IPFS Link" />
                          </a>
                      </div>
                      <button className="flex justify-center items-center py-2 bg-red-light bg-opacity-20 font-bold text-red rounded-10" onClick={() => removeFormFromList(index)}>Remove x</button>
                    </div>
                ))
              )}
            </div>
            </div>
            
            <div className="flex justify-between">
              <button onClick={onClose} className="py-2 px-4 bg-red text-white rounded-10">Close</button>
              <button onClick={onSubmit}
                className={`flex gap-2 items-center py-2 px-4 bg-green ${isLoading ? "opacity-50 cursor-disabled" : "opacity-100 cursor-pointer"} text-white rounded-10`}>
                {isLoading && <Image src={loading2} width={12} height={12} alt="Loading" />}
                {isLoading ? "Confirm" : "Create"}
              </button>
            </div>
            </div>
      
          </div>
        </>
        )}
    </>
  );
};

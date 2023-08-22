import React, { useRef, useState, ChangeEvent } from 'react';
import { create } from "ipfs-http-client";
import superTokenList, { SuperTokenInfo } from '@superfluid-finance/tokenlist';
import { ethers } from 'ethers'
import bin from '../public/bin.png';
import Image from 'next/image';
import link from '../public/link.png'

import ABI from '../constants/abi.json'
import { SUBSTREAM_CONTRACT } from '../constants/constants'

import { TransactionAwaitingModal } from './txModal/TransactionAwaitingModal';
import { TransactionSuccessModal } from './txModal/TransactionSuccessModal';

interface ModalProps {
    onClose: () => void;
    discordServerId: string;
    isOpen: boolean;
}

interface FormData {
  incomingToken: string;
  flowRate: string;
  discordServerId: string;
  finalRecipient: string;
  uri: string;
}

declare global {
  interface Window {
    ethereum: any;
  }
}

export const CreateModal: React.FC<ModalProps> = ({ onClose, discordServerId, isOpen }) => {
  if (!isOpen) return null;

  const [isUploading, setIsUploading] = useState(false);
  const [isAwaitVisible, setAwaitVisible] = useState(false);
  const [isSuccessVisible, setSuccessVisible] = useState(false);

  // Initialize IPFS client
  const projectId = process.env.NEXT_PUBLIC_INFURA_API;
  const projectSecret = process.env.NEXT_PUBLIC_INFURA_SECRET;

  const auth = "Basic " + Buffer.from(projectId + ":" + projectSecret).toString("base64");

  const client = create({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
    headers: {
      authorization: auth,
    },
  });
  
  // This function handles the file upload, pins to IPFS and sets the URL to form
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setIsUploading(true)
      try {
          const addedFile = await client.add(file);
          const ipfsUrl = `https://ipfs.infura.io/ipfs/${addedFile.path}`;
          handleFormChange('uri', ipfsUrl);
          setIsUploading(false)
      } catch (error) {
          console.error("Error uploading file to IPFS:", error);
          setIsUploading(false)
      }
    }
  };

  const acceptedTokens = ["fUSDCx", "fDAIx"];
  const acceptedChain = 80001;

  const filteredTokens: SuperTokenInfo[] = superTokenList.tokens.filter(token => 
    token.extensions?.superTokenInfo && 
    acceptedTokens.includes(token.symbol) && 
    token.chainId === acceptedChain
  );

  const flowRateMonth = ["/month"]

  const test = () => {
    console.log(addedForms)
  }

  const calculateFlowPerSecond = () => {
    // Convert the user-provided monthly flow rate (in Ether) to Wei.
    const monthlyAmountInWei = ethers.utils.parseEther(addedForms[0].flowRate.toString());
  
    // Calculate the per-second flow rate based on the monthly amount.
    const perSecondFlowRate = monthlyAmountInWei.div(ethers.BigNumber.from("2592000")); // 3600 * 24 * 30 = 2592000
  
    // Log the per-second flow rate.
    console.log(perSecondFlowRate.toString());

  };

  const initialFormState = {
    incomingToken: filteredTokens[0].address,
    flowRate: '',
    discordServerId,
    finalRecipient: '',
    uri: ''
  };

  const [form, setForm] = useState<FormData>(initialFormState);
  const [addedForms, setAddedForms] = useState<FormData[]>([]);
  const [invalidFields, setInvalidFields] = useState<(keyof FormData)[]>([]);

  const handleFormChange = (field: keyof FormData, value: string) => {
    setForm(prevState => ({
      ...prevState,
      [field]: value
    }));
    setInvalidFields(prevInvalidFields => prevInvalidFields.filter(item => item !== field));
  };

  const addFormToList = () => {
    const incompleteFields: (keyof FormData)[] = Object.keys(form)
      .filter(key => !form[key as keyof FormData])
      .map(key => key as keyof FormData);
    
    if (incompleteFields.length > 0) {
      console.log("?")
      setInvalidFields(incompleteFields);
      return;
    }
    
    setAddedForms(prevState => [...prevState, form]);
    setForm(initialFormState);
  };

  const getInputBorderColor = (field: keyof FormData) => {
    return invalidFields.includes(field) ? 'border border-red border-opacity-80' : 'border-black border-opacity-30';
  };

  const removeFormFromList = (index: number) => {
    const updatedForms = [...addedForms];
    updatedForms.splice(index, 1);
    setAddedForms(updatedForms);
  };

  const formatAddress = (address: string) => {
    if (address.length < 8) return address;  // Check to ensure address has enough characters.
    return `${address.slice(0, 5)}...${address.slice(-5)}`;
  };

  const formatURI = (uri: string) => {
    const lastPart = uri.split('/').pop() || ""; // Get the last part after the last '/'
    
    if (lastPart.length <= 8) return lastPart;
    
    return `${lastPart.slice(0, 5)}...${lastPart.slice(-5)}`;
  };

  const formatURICID = (uri: string) => {
    const lastPart = uri.split('/').pop() || ""; // Get the last part after the last '/'
    
    return lastPart;
  };

  const clearURI = () => {
    handleFormChange('uri', '');
  };

  const clearRecipient = () => {
    handleFormChange('finalRecipient', '');
  };

  const clearFlow = () => {
    handleFormChange('flowRate', '');
  };

  const clearToken = () => {
    handleFormChange('incomingToken', '');
  };

  const isValidEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const getTokenSymbolByAddress = (address: string) => {
    const token = filteredTokens.find(token => token.address === address);
    return token ? token.symbol : address;  // Return address if token not found
  };

  const handleCreateOrAdd = async () => {
    try {
    // Ensure the payment option(s) is present
    if (!addedForms || addedForms.length === 0) {
      return { error: 'No forms have been added.' };
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const contract = new ethers.Contract(SUBSTREAM_CONTRACT, ABI, signer);

    // Get gas price
    const gasPrice = await provider.getGasPrice();

    // Sort addedForms based on flowRate (ascending order)
    addedForms.sort((a, b) => parseInt(a.flowRate) - parseInt(b.flowRate));

    // Extracting respective arrays
    const incomingFlowTokens = addedForms.map(form => form.incomingToken);
    const requiredFlowRates = addedForms.map(form => parseInt(form.flowRate));
    const discordServerIds = addedForms.map(form => form.discordServerId);
    const finalRecipients = addedForms.map(form => form.finalRecipient);
    const uris = addedForms.map(form => form.uri);

    // Assuming you've an instance of your contract
    const createPaymentOptions = await contract.createOrAddPaymentOptions(
      incomingFlowTokens,
      requiredFlowRates,
      discordServerIds[0],
      finalRecipients[0],
      uris, 
      { gasPrice: gasPrice }
    );

    setAwaitVisible(true);

    const result = await createPaymentOptions.wait(); // Wait for the transaction to be mined

    if (result && result.status === 1) {
      setAwaitVisible(false);
      setSuccessVisible(true);
      return { success: "Transaction successfully mined!" };
    } else {
      // This is a failed transaction
      setAwaitVisible(false);
      return { error: 'Transaction failed.' };
    }
    
    } catch (error) {
      console.error("Error waiting for transaction:", error);
      return ({ error: `Error waiting for transaction: ${error}` });
    }
  }

  return (
      <>
        {isSuccessVisible ? (
            <TransactionSuccessModal isSuccessVisible={isSuccessVisible} onClose={onClose} />
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
                    {acceptedTokens.map(acceptedTokens => (
                      <option key={acceptedTokens} value={acceptedTokens}>{acceptedTokens}</option>
                    ))}
                  </select>
                  <div onClick={clearToken} className="cursor-pointer">
                      <Image src={bin} width={18} height={18} alt="Clean field" />
                  </div>
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
                        {flowRateMonth.map(flowRateMonth => (
                          <option key={flowRateMonth} value={flowRateMonth}>{flowRateMonth}</option>
                        ))}
                    </div>
                  </div>
                  <div onClick={clearFlow} className="cursor-pointer w-[30px] flex justify-end">
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
                  <div onClick={clearRecipient} className="cursor-pointer">
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
                        <div onClick={clearURI} className="cursor-pointer">
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
                          <div>{getTokenSymbolByAddress(item.incomingToken)}</div>
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
          <button onClick={handleCreateOrAdd} className="py-2 px-4 bg-green text-white rounded-10">Create</button>
        </div>
        </div>
  
      </div>
        </>
        )}
    </>
  );
};

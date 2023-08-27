import React, { ChangeEvent, useRef, useState } from 'react';
import { clearFields, createHandleFormChange, isValidEthereumAddress, FormData, hexToDecimalString, roundToTwoDecimals, calculateFlowPerMonth, getTokenAddressBySymbol, calculateFlowPerSecond } from '../utils/helpers';
import { SuperTokenInfo } from '@superfluid-finance/tokenlist';
import { chains, tokens, flowRateDate } from '../constants/constants'

import Image from 'next/image'
import bin from '../public/bin.png';
import loading2 from '../public/loading2.gif'

import { useIPFS } from './context/IPFSContext';
import { updatePaymentOptions } from './functions/functions';
import { useEthers } from './context/EthersContext';

interface EditModalProps {
  onClose: () => void;
  isOpen: boolean;
  paymentOption: any;
  onUpdate: (updatedOption: any) => void;
  discordServerId: string;
  filteredTokensList: SuperTokenInfo[];
  index: number;
}

export const EditModal: React.FC<EditModalProps> = ({ onClose, isOpen, paymentOption, onUpdate, discordServerId, filteredTokensList, index }) => {
  if (!isOpen) return null;
  
  const { client } = useIPFS();
  
  const { provider, contract } = useEthers();

  const [editedOption, setEditedOption] = useState(paymentOption);

  const initialFormState = {
    incomingToken: editedOption.incomingFlowToken,
    flowRate: roundToTwoDecimals(parseFloat(calculateFlowPerMonth(hexToDecimalString(editedOption.requiredFlowRate)))).toString(),
    discordServerId,
    finalRecipient: editedOption.finalRecipient,
    uri: editedOption.uri
  };

  const [form, setForm] = useState<FormData>(initialFormState);
  const [invalidFields, setInvalidFields] = useState<(keyof FormData)[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAwaitVisible, setAwaitVisible] = useState(false);
  const [isLoading, setIsLoading] = useState<Record<number, boolean>>({});

  const handleUpdate = async () => {
    setIsLoading(prevLoading => ({ ...prevLoading, [index]: true }));

    // Convert form.flowRate to Wei per second or use editedOption.requiredFlowRate as a fallback
    const flowRateWeiPerSecond = form.flowRate 
        ? calculateFlowPerSecond(form.flowRate).toString()
        : editedOption.requiredFlowRate;
      
    // Update editedOption based on form
    const updatedForms = {
      ...editedOption,
        incomingToken: getTokenAddressBySymbol(form.incomingToken, filteredTokensList) ? getTokenAddressBySymbol(form.incomingToken, filteredTokensList) : editedOption.incomingFlowToken,
        requiredFlowRate: flowRateWeiPerSecond,
        discordServerId: discordServerId,
        finalRecipient: form.finalRecipient ? form.finalRecipient : editedOption.finalRecipient,
        uri: form.uri ? form.uri : editedOption.uri,
        index: index
    };
    //console.log(updatedForms)

    const result = await updatePaymentOptions([updatedForms], provider, contract, setAwaitVisible);
    setAwaitVisible

    if (result.success) {
      setAwaitVisible(false);
      setIsLoading(prevLoading => ({ ...prevLoading, [index]: false }));
      onUpdate(editedOption);
      onClose();
    } else if (result.error) {
      setAwaitVisible(false);
      setIsLoading(prevLoading => ({ ...prevLoading, [index]: false }));
    }
  };

  
  // Handles form input field changes
  const handleFormChange = createHandleFormChange<FormData>(setForm, setInvalidFields);

  const getInputBorderColor = (field: keyof FormData) => {
    return invalidFields.includes(field) ? 'border border-red border-opacity-80' : 'border-black border-opacity-30';
  };

  // Clears fields dynamically
  const clearField: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const field = e.currentTarget.getAttribute("data-field") as keyof FormData;
    if (field) {
        clearFields([field], handleFormChange);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateNFTClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    fileInputRef.current?.click();
  };  

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

  const test = () => {
    //console.log("Editing payment option at index:", editedOption.incomingFlowToken);
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="text-medium font-bold">Update Subscription</div>
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
                value={editedOption.incomingToken}
                onChange={e => handleFormChange('incomingToken', e.target.value)}
                className={`w-full border rounded-5 py-2 px-4 ${getInputBorderColor('incomingToken')} outline-green`}
              >
                {filteredTokensList.map(tokens => (
                  <option key={tokens.symbol} value={tokens.symbol}>{tokens.symbol}</option>
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
                value={form.flowRate ? form.flowRate : roundToTwoDecimals(parseFloat(calculateFlowPerMonth(hexToDecimalString(editedOption.requiredFlowRate))))}
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
                value={form.finalRecipient ? form.finalRecipient : editedOption.finalRecipient}
                onChange={e => handleFormChange('finalRecipient', e.target.value)}  
              />
              <div onClick={clearField} data-field="finalRecipient" className="cursor-pointer">
                <Image src={bin} width={18} height={18} alt="clean field" />
              </div>
            </div>
            {!isValidEthereumAddress(editedOption.finalRecipient) && editedOption.finalRecipient !== "" && 
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
                <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                />
                <div onClick={handleUpdateNFTClick} className="flex justify-center text-white bg-green rounded-15 py-2 cursor-pointer mt-2">Update NFT</div>
              </div>
          <div className="flex justify-between mt-4">
            <button className="py-2 px-4 border border-black border-opacity-20 rounded-15 hover:border-blue hover:text-white hover:bg-blue transition" onClick={onClose} disabled={isLoading[index]}>Back</button>
            <button className="flex gap-2 items-center py-2 px-4 border border-black border-opacity-20 rounded-15 hover:border-green hover:text-white hover:bg-green transition"
              disabled={isLoading[index]}
              onClick={handleUpdate}>
              {isLoading[index] && <Image src={loading2} width={12} height={12} alt="Loading" />}
              {isLoading[index] ? (isAwaitVisible ? "Updating" : "Confirm") : "Update"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
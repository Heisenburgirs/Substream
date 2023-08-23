import React, { useState, useEffect } from 'react';
import Image from 'next/image'

interface ModalProps {
  onClose: () => void;
  discordServerId: string;
  isOpen: boolean;
  paymentOptions: Record<string, any[]>;
}

export const ManageModal: React.FC<ModalProps> = ({ onClose, discordServerId, isOpen, paymentOptions }) => {
  if (!isOpen) return null;

  const [paymentOptionsExtracted, setExtracted] = useState<any[]>([]);

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

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white">
          {paymentOptionsExtracted.map((option, index) => (
            <div key={index}>
              <p>Incoming Flow Token: {option.incomingFlowToken}</p>
              <p>Final Recipient: {option.finalRecipient}</p>
              <p>Required Flow Rate: {option.requiredFlowRate}</p>
              <p>URI: {option.uri}</p>
            </div>
          ))}
        </div>
    </div>
  );
}

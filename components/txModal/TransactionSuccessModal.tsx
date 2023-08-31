import React from 'react';
import Image from 'next/image'
import success from '../../public/success.png'

interface TransactionSuccessModalProps {
  isSuccessVisible: boolean;
  onClose: () => void;
  successMsg: string;
  }

export const TransactionSuccessModal: React.FC<TransactionSuccessModalProps> = ({ isSuccessVisible, onClose, successMsg }) => {
  if (!isSuccessVisible) {
    return null;
  }

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-[400px] h-[300px] bg-white shadow-md rounded-20 py-8 px-4 flex flex-col justify-center items-center gap-12">
              <div className="flex flex-col gap-4 justify-center items-center">
                  <div className="flex flex-col gap-8 justify-center items-center">
                    <Image src={success} width={75} height={75} alt="Account initialized" />
                    <div className="flex flex-col gap-4 justify-center items-center">
                      <div className="font-bold text-medium">{successMsg} 🎉!</div>
                      <button onClick={onClose} className="max-w-[100px] py-2 px-4 bg-red text-white rounded-10">Close</button>
                    </div>
                  </div>
              </div>
          </div>
      </div>
  );
}

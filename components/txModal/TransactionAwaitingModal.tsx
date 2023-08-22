import React from 'react';
import Image from 'next/image'
import parrot from '../../public/loading.gif'

interface TransactionAwaitingModalProps {
  isAwaitVisible: boolean;
  }

export const TransactionAwaitingModal: React.FC<TransactionAwaitingModalProps> = ({ isAwaitVisible }) => {
  if (!isAwaitVisible) {
    return null;
  }

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-[400px] h-[300px] bg-white shadow-md rounded-20 py-8 px-4 flex flex-col justify-center items-center gap-12">
              <div className="flex flex-col gap-4 justify-center items-center">
                  <div className="flex flex-col gap-8 justify-center items-center">
                    <Image src={parrot} width={75} height={75} alt="Account initialized" />
                    <div className="flex flex-col gap-4 justify-center items-center">
                      <div className="text-medium">Transaction Submitted!</div>
                      <div className="font-bold">Watch this parrot while TX is mined</div>
                    </div>
                  </div>
              </div>
          </div>
      </div>
  );
}

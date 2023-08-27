import Image from 'next/image'
import discord from '../../public/discord.png'

import { SubscribeModal } from '../SubscribeModal';
import { useState } from 'react';

interface SubscribeProps {
    name: string;
    discordServerId: string;
    paymentOptions: Record<string, any[]>;
}

export const Subscribe: React.FC<SubscribeProps> = ({ name, discordServerId, paymentOptions }) => {
	const [isLoading, setIsLoading] = useState(true);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [serverId, setServerId] = useState<string | null>(null);
  const [hasPaymentOptions, setHasPaymentOptions] = useState<boolean>(false);

  const handleSubscribeClick = (serverId: string) => {
    setServerId(discordServerId); // Set the server ID when the button is clicked
    setIsSubscribeModalOpen(true); // Open the modal
  };
  
    return (
			<div className="flex flex-col shadow-md gap-8 py-4 rounded-15 justify-center items-center py-4 px-8 ">
        <div className="flex flex-col justify-center items-center gap-4">
            <Image src={discord} width={150} height={150} alt="Discord server" />
            <div className="font-bold">{name}</div>
            <div className="max-w-[200px] max-h-[100px] text-center overflow-auto hide-scrollbar">
                Best programming discord server that you can find anywhere on Discord. Join now and get special perks
            </div>
        </div>
        <button onClick={() => handleSubscribeClick(name)} className="w-full shadow-md rounded-15 py-2 hover:bg-green-light transition transition-all">Subscribe</button>
        <SubscribeModal 
          onClose={() => setIsSubscribeModalOpen(false)}
          isOpen={isSubscribeModalOpen}
          discordServerId={serverId}
          paymentOptions={paymentOptions}
        />
			</div>
		)
};
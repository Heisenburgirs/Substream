import Image from 'next/image'
import discord from '../../public/discord.png'

interface SubscribeProps {
    name: string;
}

export const Subscribe: React.FC<SubscribeProps> = ({ name }) => {
    return (
			<div className="flex flex-col shadow-md gap-8 py-4 rounded-15 justify-center items-center py-4 px-8 ">
                <div className="flex flex-col justify-center items-center gap-4">
                    <Image src={discord} width={150} height={150} alt="Discord server" />
                    <div className="font-bold">{name}</div>
                    <div className="max-w-[200px] max-h-[100px] text-center overflow-auto hide-scrollbar">
                        Best programming discord server that you can find anywhere on Discord. Join now and get special perks
                    </div>
                </div>
                <button className="w-full shadow-md rounded-15 py-2 hover:bg-green-light transition transition-all">Subscribe</button>
			</div>
		)
};
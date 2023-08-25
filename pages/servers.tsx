import type { NextPage } from 'next';
import { useDiscordContext } from '../components/context/DiscordContext';
import { Manage } from '../components/Owner/Manage';
import { ethers } from 'ethers'
import { useEffect, useState } from 'react';
import { SUBSTREAM_CONTRACT } from '../constants/constants';
import ABI from '../constants/abi.json'
import { useEthers } from '../components/context/EthersContext';
import { useUserContext } from '../components/context/UserContext';
import { useAccount } from 'wagmi';
import { handleInitializingUpdate } from '../components/functions/functions';

const Servers: NextPage = () => {
  const { user, setUser, initialized, setInitialized } = useUserContext();
  const { discord, setDiscord, discordOwner, setDiscordOwner } = useDiscordContext();
  const { address, isConnected } = useAccount();
  const [paymentOptions, setPaymentOptions] = useState<Record<string, any[]>>({});
  const { isBlockchainOperationInProgress, setIsBlockchainOperationInProgress } = useEthers();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { provider, contract } = useEthers();

  useEffect(() => {
    if (isBlockchainOperationInProgress) return;

    const paymentOptionsByServer: { [key: string]: any } = {};
    async function queryPaymentOptions() {
      

      if (discordOwner)
      for (let server of discordOwner) {
        const options = await contract?.getPaymentOptionsByDiscordId(server.id);
        paymentOptionsByServer[server.id] = options;
      }

      setPaymentOptions(paymentOptionsByServer);
      console.log(paymentOptionsByServer)
    }

    queryPaymentOptions();
  }, [discordOwner, isBlockchainOperationInProgress]);

  const tableRows = (discordOwner || []).map(server => {
    const hasPaymentOptions = paymentOptions[server.id]?.length > 0;
    return {  
      name: server.name,
      id: server.id,
      subscription: hasPaymentOptions,
      action: hasPaymentOptions ? "Manage" : "Create"
    };
  });

  const test = () => {
    console.log("test", discordOwner)
  }

  // Check for prop values if they're populated, update state accordingly
  useEffect(() => {
    if (address && Array.isArray(discordOwner) && discordOwner.length > 0) {
        console.log("arrays available")
    } else {
      console.log("arrays unavailable")
    }
  }, [address, discordOwner]);
  
  const handleInitializingFunc = async () => {
    try {
      setIsLoading(true);

      if (!address || !discordOwner) {
        throw new Error("Address or server is not defined");
      }

      const responseData = await handleInitializingUpdate(address, discordOwner?.map(server => server.id));

      setIsLoading(false);
      setIsSuccess(true);

      console.log("Response from backend:", responseData);
    } catch (error) {
      // Handle errors
      setIsLoading(false);
      if (error instanceof Error) {
        if ('code' in error && error.code === 4001) {
          console.log("User canceled signature.");
        } else {
          console.log("Couldn't Obtain Signature");
        }
      } else {
        console.log("An unexpected error occurred");
      }
    }
  };

  return (
    <main className="flex flex-col gap-12 px-8 py-8 items-start flex-wrap rounded-15">
        <div className="grid w-full gap-4">
          <div onClick={handleInitializingFunc} className={`flex max-w-[100px] items-center justify-center ${isLoading ? "bg-blue text-white border-blue" : "bg-white"} border border-black border-opacity-20  py-2 px-4 rounded-10 hover:cursor-pointer hover:border-blue hover:bg-blue hover:text-white transition`}>
            {isLoading ? "Updating..." : "Update"}
          </div>
					<Manage rows={tableRows} paymentOptions={paymentOptions} />
        </div>
    </main>
  );
};

export default Servers;

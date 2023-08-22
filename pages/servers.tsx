import type { NextPage } from 'next';
import { useDiscordContext } from '../components/context/DiscordContext';
import { Manage } from '../components/Owner/Manage';
import { ethers } from 'ethers'
import { useEffect, useState } from 'react';
import { SUBSTREAM_CONTRACT } from '../constants/constants';
import ABI from '../constants/abi.json'

const Servers: NextPage = () => {
  const { discordOwner } = useDiscordContext();
  const [paymentOptions, setPaymentOptions] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const paymentOptionsByServer: { [key: string]: any } = {};
    async function queryPaymentOptions() {


      // Initialize the Ethereum provider and contract
      const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const contract = new ethers.Contract(SUBSTREAM_CONTRACT, ABI, provider);
      

      if (discordOwner)
      for (let server of discordOwner) {
        const options = await contract.getPaymentOptionsByDiscordId(server.id);
        paymentOptionsByServer[server.id] = options;
      }

      setPaymentOptions(paymentOptionsByServer);
      console.log(paymentOptionsByServer)
    }

    queryPaymentOptions();
  }, [discordOwner]);

  const tableRows = (discordOwner || []).map(server => {
    const hasPaymentOptions = paymentOptions[server.id]?.length > 0;
    return {  
      name: server.name,
      id: server.id,
      subscription: true, // Assuming this remains static for now
      action: hasPaymentOptions ? "Manage" : "Create"
    };
  });

  return (
    <main className="flex flex-col gap-12 px-8 py-8 items-start flex-wrap rounded-15">
        <div className="grid w-full">
					<Manage rows={tableRows} />
        </div>
    </main>
  );
};

export default Servers;

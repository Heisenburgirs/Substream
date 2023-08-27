import type { NextPage } from 'next';
import Head from 'next/head';
import { UserInfo } from '../components/User/UserInfo'
import { SubscribeHeader } from '../components/subscribtions/SubscribeHeader';
import { Subscribe } from '../components/subscribtions/Subscribe'
import { useDiscordContext } from '../components/context/DiscordContext';
import { useEffect, useState } from 'react';
import { useEthers } from '../components/context/EthersContext';

// Redeclare Discord Interface
interface Discord {
  id: string;
  name: string;
  owner: boolean;
}

const Home: NextPage = () => {
  const { discord, discordOwner } = useDiscordContext();
  const [paymentOptions, setPaymentOptions] = useState<Record<string, any[]>>({});
  const { contract } = useEthers()

  // This useEffect fetches payment options for each server and updates the state
  useEffect(() => {
    if (!discord) return;

    const fetchPaymentOptions = async () => {
      const optionsByServer: { [key: string]: any[] } = {};

      for (const server of discord) {
        const options = await contract?.getPaymentOptionsByDiscordId(server.id);
        if (options && options.length > 0) {
          optionsByServer[server.id] = options;
        }
      }

      setPaymentOptions(optionsByServer);
    };

    fetchPaymentOptions();
  }, [discord]);

  return (
    <div>
      <Head>
        <title>Substream</title>
        <meta
          content="Stream Gated Communities"
          name="Stream Gated Communities"
        /> 
      </Head>

      <main className="flex flex-col gap-12 px-8 py-4 items-start flex-wrap">
        {/*<UserInfo />*/}
        <SubscribeHeader />
        <div className="grid sm:grid-cols-1 base:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-4">
          {discord &&
            discord.map((server) => {
              if (paymentOptions[server.id]) {
                return (
                  <Subscribe
                    key={server.id}
                    name={server.name}
                    discordServerId={server.id}
                    paymentOptions={paymentOptions}
                  />
                );
              }
              return null;
            })}
        </div>
      </main>
    </div>
  );
};

export default Home;

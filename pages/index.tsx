import type { NextPage } from 'next';
import Head from 'next/head';
import { UserInfo } from '../components/User/UserInfo'
import { SubscribeHeader } from '../components/subscribtions/SubscribeHeader';
import { Subscribe } from '../components/subscribtions/Subscribe'
import { useDiscordContext } from '../components/context/DiscordContext';
import { useEffect } from 'react';

// Redeclare Discord Interface
interface Discord {
  id: string;
  name: string;
  owner: boolean;
}

const Home: NextPage = () => {
  const { discord, discordOwner } = useDiscordContext();
  
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
          {
            discord && discord.map(discord => (
                <Subscribe
                    key={discord.id}
                    name={discord.name}
                />
            ))
          }
        </div>
      </main>
    </div>
  );
};

export default Home;

import type { NextPage } from 'next';
import { useDiscordContext } from '../components/context/DiscordContext';
import { Manage } from '../components/Owner/Manage';

const Servers: NextPage = () => {
  const { discordOwner } = useDiscordContext();

  const tableRows = (discordOwner || []).map(server => ({
		name: server.name,
		id: server.id,
		subscription: true,
		action: "Create"
	}));

  return (
    <main className="flex flex-col gap-12 px-8 py-8 items-start flex-wrap rounded-15">
        <div className="grid w-full">
					<Manage rows={tableRows} />
        </div>
    </main>
  );
};

export default Servers;

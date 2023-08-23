import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import {
  goerli,
  polygonMumbai,
} from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { SessionProvider } from "next-auth/react"
import { UserProviderComponent } from '../components/context/UserContext';
import { DiscordProviderComponent } from '../components/context/DiscordContext';
import { useRouter } from 'next/router';
import { Header } from '../components/Header';
import { create } from 'ipfs-http-client';
import { IPFSProvider } from '../components/context/IPFSContext';
import { EthersProvider } from '../components/context/EthersContext'; 
import { SUBSTREAM_CONTRACT } from '../constants/constants';
import ABI from '../constants/abi.json'

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    polygonMumbai,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [goerli] : []),
  ],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'Substream',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID || "",
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

// IPFS client initialization
const projectId = process.env.NEXT_PUBLIC_INFURA_API;
const projectSecret = process.env.NEXT_PUBLIC_INFURA_SECRET;

const auth = "Basic " + Buffer.from(projectId + ":" + projectSecret).toString("base64");

const client = create({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  headers: {
    authorization: auth,
  },
});

function MyApp({Component, pageProps: { session, ...pageProps }, }: any) {
  const router = useRouter();
  

  return (
    <SessionProvider session={pageProps.session}>
      <UserProviderComponent>
        <DiscordProviderComponent>
          <WagmiConfig config={wagmiConfig}>
            <RainbowKitProvider chains={chains}>
              <EthersProvider SUBSTREAM_CONTRACT={SUBSTREAM_CONTRACT} ABI={ABI}>
                <IPFSProvider client={client}>
                  <Header />
                  <Component {...pageProps} />
                </IPFSProvider>
              </EthersProvider>
            </RainbowKitProvider>
          </WagmiConfig>
        </DiscordProviderComponent>
      </UserProviderComponent>
    </SessionProvider>
  );
}

export default MyApp;

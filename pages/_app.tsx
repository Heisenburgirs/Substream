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

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    polygonMumbai,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [goerli] : []),
  ],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'Substream',
  projectId: process.env.WALLET_CONNECT_ID || "",
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

function MyApp({Component, pageProps: { session, ...pageProps }, }: any) {

  return (
    <SessionProvider session={pageProps.session}>
      <UserProviderComponent>
        <DiscordProviderComponent>
          <WagmiConfig config={wagmiConfig}>
            <RainbowKitProvider chains={chains}>
              <Component {...pageProps} />
            </RainbowKitProvider>
          </WagmiConfig>
        </DiscordProviderComponent>
      </UserProviderComponent>
    </SessionProvider>
  );
}

export default MyApp;

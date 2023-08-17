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
  projectId: '3eb60e45586f4007d101aa0c6a16db47',
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

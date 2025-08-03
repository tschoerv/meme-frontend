"use client";
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import {  mainnet } from 'wagmi/chains';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { cookieStorage, createStorage, http, fallback } from 'wagmi';
import { useState, useEffect } from 'react';

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
const RPC = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL;
const RPC_FALLBACK = process.env.NEXT_PUBLIC_INFURA_RPC_URL

export const config = getDefaultConfig({
  appName: 'Meme 2016',
  projectId,
  chains: [mainnet],
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [mainnet.id]: fallback([                                    
        http(RPC,  { retryCount: 0 }),      // first choice
        http(RPC_FALLBACK, { retryCount: 0 }),      // silent backup
      ]),
  },
});

const client = new QueryClient();

export function Providers({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <RainbowKitProvider>
          {mounted && children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
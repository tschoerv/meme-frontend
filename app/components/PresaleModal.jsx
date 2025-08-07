'use client';

import { useState } from 'react';
import {
  Tabs,
  Tab,
  Cursor
} from '@react95/core';
import ConnectButton95 from './ConnectButton95';
import PrivateSaleTab from './PrivateSale';
import PublicSaleTab from './PublicSale';

export default function PresaleModal() {
  const [activeTab, setActiveTab] = useState('private');
  const PRIVATE_SALE_ADDRESS = process.env.NEXT_PUBLIC_PRIVATE_SALE_ADDRESS;
  const PUBLIC_SALE_ADDRESS = process.env.NEXT_PUBLIC_PUBLIC_SALE_ADDRESS;
  
  const contractAddress = activeTab === 'public' ? PUBLIC_SALE_ADDRESS : PRIVATE_SALE_ADDRESS;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: "relative", minWidth: 380 }}>
      <ConnectButton95 />
      <div className="mt-2">
        <Tabs defaultActiveTab="Public Sale" onChange={(title) => {
          if (title === 'Public Sale') setActiveTab('public');
          else setActiveTab('private');
        }}>
          <Tab title="Private Sale" style={{ cursor: `url(${Cursor.Pointer}), pointer` }}>
            <PrivateSaleTab />
          </Tab>
          <Tab title="Public Sale" style={{ cursor: `url(${Cursor.Pointer}), pointer` }}>
            <PublicSaleTab />
          </Tab>
        </Tabs>
      </div>

      <div className="flex flex-row justify-center mt-2 mb-0">
        <span className="mr-1">Contract:</span>
        <a
          href={`https://etherscan.io/address/${contractAddress}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>[{contractAddress?.slice(0, 6)}…{contractAddress?.slice(-4)}]</span>
        </a>
      </div>
    </div>
  );
}
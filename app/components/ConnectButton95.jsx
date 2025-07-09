'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button, Cursor } from '@react95/core';
import { User } from '@react95/icons';

export default function ConnectButton95() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
        if (!mounted) return null;
        const connected = !!account && !!chain;
        return (
          <Button onClick={connected ? openAccountModal : openConnectModal} style={{ cursor: `url(${Cursor.Pointer}), pointer` }}>
            {connected ? (
              <>
                <span className="flex items-center justify-center ">
                  <User variant="16x16_4" className="mr-0.5 relative -top-[1px]" />
                  <span>{account.ensName || account.displayName}</span>
                </span>
              </>
            ) : (
              'Connect wallet'
            )}
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}
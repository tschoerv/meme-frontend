'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button, Cursor } from '@react95/core';
import { User } from '@react95/icons';
import { useSwitchChain } from 'wagmi';

export default function ConnectButton95() {
  const { switchChain } = useSwitchChain();

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
        if (!mounted) return null;

        const connected      = !!account && !!chain;
        const isWrongChain   = chain?.id !== 1;     // 1 = Ethereum Mainnet
        const canSwitchChain = !!switchChain;       // some wallets don’t expose it

        const handleClick = () => {
          if (!connected) return openConnectModal();

          if (isWrongChain && canSwitchChain) {
            switchChain({ chainId: 1 });           // swap to mainnet
            return;
          }

          return openAccountModal();
        };

        return (
          <Button
            onClick={handleClick}
	    className="w-full"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: `url(${Cursor.Pointer}), pointer`,
              gap: 4    // small space between icon and text
            }}
          >
            {connected ? (
              <span className="flex items-center">
                <User variant="16x16_4" className="mr-0.5 relative -top-[1px]" />
                {isWrongChain
                  ? 'Switch to Mainnet'
                  : account.ensName || account.displayName}
              </span>
            ) : (
              'Connect Wallet'
            )}
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}
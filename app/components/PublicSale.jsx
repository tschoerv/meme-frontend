'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Button,
  Input,
  Fieldset,
  Checkbox,
  Tooltip,
  Cursor
} from '@react95/core';
import {
  useAccount,
  useReadContract,
  useSimulateContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { parseEther, formatEther } from 'viem';

import { PUBLIC_SALE_ABI } from '../abi/publicSaleAbi';

const TOKEN_SYMBOL = 'MEME';
const PUBLIC_SALE_ADDRESS = process.env.NEXT_PUBLIC_PUBLIC_SALE_ADDRESS;

function formatTime(t) {
  const d = Math.floor(t / 86400);
  const h = Math.floor((t % 86400) / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${d}d ${h}h ${m}m ${s}s`;
}

export default function PublicSaleTab() {
  const { address: caller, isConnected } = useAccount();
  const qc = useQueryClient();
  const [ethAmount, setEthAmount] = useState('0.1');
  const [nowTs, setNowTs] = useState(() => Math.floor(Date.now() / 1000));

  const hasContract =
    PUBLIC_SALE_ADDRESS &&
    /^0x[0-9a-fA-F]{40}$/.test(PUBLIC_SALE_ADDRESS) &&
    !/^0x0{40}$/i.test(PUBLIC_SALE_ADDRESS);

  useEffect(() => {
    const id = setInterval(() => setNowTs(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: isPaused } = useReadContract({
    address: PUBLIC_SALE_ADDRESS,
    abi: PUBLIC_SALE_ABI,
    functionName: 'paused',
    enabled: hasContract,
  });

  const { data: saleOpensAt } = useReadContract({
    address: PUBLIC_SALE_ADDRESS,
    abi: PUBLIC_SALE_ABI,
    functionName: 'saleOpensAt',
    enabled: hasContract,
  });

  const { data: maxAllocation } = useReadContract({
    address: PUBLIC_SALE_ADDRESS,
    abi: PUBLIC_SALE_ABI,
    functionName: 'MAX_ALLOCATION',
    enabled: hasContract,
  });

  const { data: weiPerToken } = useReadContract({
    address: PUBLIC_SALE_ADDRESS,
    abi: PUBLIC_SALE_ABI,
    functionName: 'weiPerToken',
    enabled: hasContract,
  });

  const { data: tokensSold, queryKey: tokensSoldKey } = useReadContract({
    address: PUBLIC_SALE_ADDRESS,
    abi: PUBLIC_SALE_ABI,
    functionName: 'tokensSold',
    enabled: hasContract,
  });

  const { data: alreadyPurchased, queryKey: purchasedKey } = useReadContract({
    address: PUBLIC_SALE_ADDRESS,
    abi: PUBLIC_SALE_ABI,
    functionName: 'purchased',
    args: [caller],
    enabled: hasContract && !!caller,
  });

  const openTime = hasContract ? (saleOpensAt ? Number(saleOpensAt) : 0) : 0;
  const isOpen = hasContract && !isPaused && openTime !== 0 && nowTs >= openTime;
  const beforeOpen = openTime !== 0 && nowTs < openTime;
  const timeLeft = formatTime(Math.max(openTime - nowTs, 0));

  const ethValue = ethAmount ? parseEther(ethAmount) : 0n;
  const maxEth = maxAllocation ? formatEther(maxAllocation) : '0.1';
  
  const tokensToReceive = weiPerToken && ethValue > 0n ? ethValue / weiPerToken : 0n;

  const {
    data: simBuy,
    error: simError,
    status: simStatus,
    refetch: refetchSim,
  } = useSimulateContract({
    address: PUBLIC_SALE_ADDRESS,
    abi: PUBLIC_SALE_ABI,
    functionName: 'buy',
    account: caller,
    value: ethValue,
    enabled: hasContract && isConnected && ethValue > 0n && !alreadyPurchased,
  });

  /* retry sim once per second while round open but sim reverts w/ claim-not-open */
      const lastTryRef = useRef(0);
      useEffect(() => {
        if (!hasContract) return;
    
        const claimNotOpen =
          simStatus === 'error' &&
          /Sale not open/i.test(simError?.shortMessage || '');
    
        const needRetry =
          isOpen && isConnected && !alreadyPurchased && claimNotOpen;
    
        const now = Date.now();
        if (needRetry && now - lastTryRef.current > 500) {
          lastTryRef.current = now;
          refetchSim();
        }
      }, [
        hasContract, isOpen, isConnected, 
        alreadyPurchased, simStatus, simError, refetchSim,
      ]);

  const { writeContract, data: txHash } = useWriteContract();
  const { isSuccess: mined } = useWaitForTransactionReceipt({ hash: txHash });
  const buyPending = !!txHash && !mined;

  const canBuy =
    hasContract &&
    isConnected &&
    isOpen &&
    !alreadyPurchased &&
    ethValue > 0n &&
    ethValue <= (maxAllocation || parseEther('0.1')) &&
    simStatus === 'success' &&
    !!simBuy?.request &&
    !buyPending;

  const buyLabel =
    buyPending ? 'Pending…' :
      alreadyPurchased ? 'Already Purchased' :
        !ethAmount ? 'Enter ETH Amount' :
          ethValue > (maxAllocation || parseEther('0.1')) ? 'Amount Too High' :
            'Buy MEME';

  const handleBuy = () => {
    if (simBuy?.request) writeContract(simBuy.request);
  };

  useEffect(() => {
    if (mined) {
      qc.invalidateQueries({ queryKey: purchasedKey });
      qc.invalidateQueries({ queryKey: tokensSoldKey });
    }
  }, [mined, purchasedKey, tokensSoldKey, qc]);

  const showManual = !hasContract || !isOpen || !isConnected;
  const showBuy = hasContract && isOpen && isConnected;

  return (
    <div style={{ minWidth: 330 }}>
      <Fieldset legend="Sale Status" width="350px" className="flex flex-col mb-3">
        <Checkbox readOnly checked={isOpen}>
          {isOpen
            ? 'Public Sale Open'
            : beforeOpen
              ? `Public Sale Opens in ${timeLeft}`
              : 'Public Sale Closed'}
        </Checkbox>

        <Checkbox readOnly checked={hasContract}>
          Max Allocation: {maxEth} ETH per wallet
        </Checkbox>

        <Checkbox readOnly checked={!!tokensSold || hasContract}>
          Tokens Sold: {tokensSold ? Number(tokensSold).toLocaleString('en-US') : '0'} {"/ 103,560"} {TOKEN_SYMBOL}
        </Checkbox>

        <Checkbox readOnly checked>
          <Tooltip text="Open to everyone - no whitelist required!" delay={300}>
            <u>Public Sale</u>
          </Tooltip>
        </Checkbox>
      </Fieldset>

      {showManual && (
        <div className="flex flex-col items-center space-y-2">
          <p className="text-center text-sm">
            Connect your wallet to participate in the public sale
          </p>
        </div>
      )}

      {showBuy && (
        <div className="flex flex-col items-center justify-center mt-2">
          <div className="flex items-center justify-center mb-2 mt-0">
            <Input
              placeholder="0.1"
              value={ethAmount}
              onChange={e => {
                const value = e.target.value;
                if (value === '' || (parseFloat(value) <= parseFloat(maxEth) && parseFloat(value) >= 0)) {
                  setEthAmount(value);
                }
              }}
              className="w-[45px] mr-2"
              type="number"
              step="0.01"
              max={maxEth}
            />
            <span className="text-sm mr-1 mt-0.5">ETH = </span>
            <span className="text-sm mt-0.5 text-blue-900">
              {ethAmount && tokensToReceive > 0n 
                ? `${Number(tokensToReceive).toLocaleString('en-US')} ${TOKEN_SYMBOL}`
                : `0 ${TOKEN_SYMBOL}`
              }
            </span>
          </div>

          <Button
            disabled={!canBuy}
            onClick={handleBuy}
            className="w-80"
            style={{ cursor: `url(${Cursor.Pointer}), pointer` }}
          >
            {buyLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
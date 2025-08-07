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
import { isEthAddress } from '../utils/isAddress.js';
import { parseEther } from 'viem';

import proofsPresale from '../proofs_presale.js';
import { PRIVATE_SALE_ABI } from '../abi/privateSaleAbi';

const TOKEN_SYMBOL = 'MEME';
const PRIVATE_SALE_ADDRESS = process.env.NEXT_PUBLIC_PRIVATE_SALE_ADDRESS;
const MAX_ALLOCATION = '0.1';
const WEI_PER_TOKEN = 28968713789107n;
const TOTAL_SALE_AMOUNT = 103560;
const PRESET_PRIVATE_SALE_OPENS_AT = 1754582400;
const EARLY_BUFFER = 5;                 // UI flips 5 s early

function getProofForPresale(addr) {
  if (!addr) return [];
  const row = proofsPresale.find(p => p.address.toLowerCase() === addr.toLowerCase());
  return row ? row.proof : [];
}

function formatTime(t) {
  const d = Math.floor(t / 86400);
  const h = Math.floor((t % 86400) / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${d}d ${h}h ${m}m ${s}s`;
}

export default function PrivateSaleTab() {
  const { address: caller, isConnected } = useAccount();
  const qc = useQueryClient();
  const [beneficiary, setBeneficiary] = useState(caller ?? '');
  const [ethAmount, setEthAmount] = useState('0.1');
  const [nowTs, setNowTs] = useState(() => Math.floor(Date.now() / 1000));

  const hasContract =
    PRIVATE_SALE_ADDRESS &&
    /^0x[0-9a-fA-F]{40}$/.test(PRIVATE_SALE_ADDRESS) &&
    !/^0x0{40}$/i.test(PRIVATE_SALE_ADDRESS);

  useEffect(() => {
    const id = setInterval(() => setNowTs(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: isPaused } = useReadContract({
    address: PRIVATE_SALE_ADDRESS,
    abi: PRIVATE_SALE_ABI,
    functionName: 'paused',
    enabled: hasContract,
  });

  const { data: saleOpensAt } = useReadContract({
    address: PRIVATE_SALE_ADDRESS,
    abi: PRIVATE_SALE_ABI,
    functionName: 'saleOpensAt',
    enabled: hasContract,
  });

  const { data: tokensSold, queryKey: tokensSoldKey } = useReadContract({
    address: PRIVATE_SALE_ADDRESS,
    abi: PRIVATE_SALE_ABI,
    functionName: 'tokensSold',
    enabled: hasContract,
  });

  const { data: alreadyPurchased, queryKey: claimedKey } = useReadContract({
    address: PRIVATE_SALE_ADDRESS,
    abi: PRIVATE_SALE_ABI,
    functionName: 'hasPurchased',
    args: [beneficiary],
    enabled: hasContract && !!beneficiary,
  });

  const { data: delegateUsed, queryKey: delegateKey } = useReadContract({
    address: PRIVATE_SALE_ADDRESS,
    abi: PRIVATE_SALE_ABI,
    functionName: 'delegateUsed',
    args: [caller],
    enabled: hasContract && !!caller,
  });

  useEffect(() => {
    if (isConnected && caller) setBeneficiary(caller);
  }, [isConnected, caller]);

  const openTime = hasContract ? (saleOpensAt ? Number(saleOpensAt) : 0) : PRESET_PRIVATE_SALE_OPENS_AT;
  const isOpen = hasContract && !isPaused && openTime !== 0 && nowTs >= (openTime - EARLY_BUFFER);
  const beforeOpen = openTime !== 0 && nowTs < (openTime - EARLY_BUFFER);
  const timeLeft = formatTime(Math.max(openTime - nowTs, 0));

  const proof = getProofForPresale(beneficiary);
  const validAddr = isEthAddress(beneficiary);
  const eligible = validAddr && proof.length > 0;

  const isValidEthAmount = ethAmount && /^[0-9]*\.?[0-9]*$/.test(ethAmount) && ethAmount !== '.' && ethAmount !== '';
  const ethValue = isValidEthAmount ? parseEther(ethAmount) : 0n;

  const tokensToReceive = WEI_PER_TOKEN && ethValue > 0n ? ethValue / WEI_PER_TOKEN : 0n;

  const isSoldOut = tokensSold && Number(tokensSold) >= TOTAL_SALE_AMOUNT;

  const {
    data: simBuy,
    error: simError,
    status: simStatus,
    refetch: refetchSim,
  } = useSimulateContract({
    address: PRIVATE_SALE_ADDRESS,
    abi: PRIVATE_SALE_ABI,
    functionName: 'buy',
    args: [beneficiary, proof],
    account: caller,
    value: ethValue,
    query: {
      enabled: hasContract && isConnected && eligible && ethValue > 0n && !alreadyPurchased && !delegateUsed
    }
  });

  /* retry sim once per second while round open but sim reverts w/ claim-not-open */
  const lastTryRef = useRef(0);
  useEffect(() => {
    if (!hasContract) return;

    const claimNotOpen =
      simStatus === 'error' &&
      /Sale not open/i.test(simError?.shortMessage || '');

    const needRetry =
      isOpen && isConnected && eligible && !alreadyPurchased && !delegateUsed && claimNotOpen;

    const now = Date.now();
    if (needRetry && now - lastTryRef.current > 500) {
      lastTryRef.current = now;
      refetchSim();
    }
  }, [
    hasContract, isOpen, isConnected, eligible,
    alreadyPurchased, delegateUsed, simStatus, simError, refetchSim,
  ]);

  const { writeContract, data: txHash } = useWriteContract();
  const { isSuccess: mined } = useWaitForTransactionReceipt({ hash: txHash });
  const buyPending = !!txHash && !mined;

  const canBuy =
    hasContract &&
    isConnected &&
    isOpen &&
    eligible &&
    !alreadyPurchased &&
    !delegateUsed &&
    ethValue > 0n &&
    ethValue <= parseEther(MAX_ALLOCATION) &&
    simStatus === 'success' &&
    !!simBuy?.request &&
    !buyPending &&
    !isSoldOut;

  const buyLabel =
    buyPending ? 'Pending…' :
      isSoldOut ? 'Sold Out' :
        !isConnected ? 'Connect Wallet' :
          alreadyPurchased ? 'Already Purchased' :
            delegateUsed ? 'Delegate Slot Used' :
              beforeOpen ? 'Starts Soon' :
                !eligible ? 'Not Eligible' :
                  !ethAmount ? 'Enter ETH Amount' :
                    caller && beneficiary && caller.toLowerCase() !== beneficiary.toLowerCase()
                      ? 'Delegate Buy'
                      : 'Buy MEME';

  const handleBuy = () => {
    if (simBuy?.request) writeContract(simBuy.request);
  };

  useEffect(() => {
    if (mined) {
      qc.invalidateQueries({ queryKey: claimedKey });
      qc.invalidateQueries({ queryKey: tokensSoldKey });
      qc.invalidateQueries({ queryKey: delegateKey });
    }
  }, [mined, claimedKey, tokensSoldKey, delegateKey, qc]);

  return (
    <div style={{ minWidth: 330 }}>
      <Fieldset legend="Sale Status" width="350px" className="flex flex-col mb-3">
        <Checkbox readOnly checked={isOpen && !isSoldOut}>
          {hasContract ? (
            isSoldOut
              ? 'Round Sold Out'
              : isOpen
                ? 'Private Sale Open'
                : beforeOpen
                  ? `Private Sale Opens in ${timeLeft}`
                  : 'Private Sale Closed'
          ) : (
            beforeOpen
              ? `Round Opens in ${timeLeft}`
              : 'Round Closed'
          )}
        </Checkbox>

        <Checkbox readOnly checked>
          Max Allocation: {MAX_ALLOCATION} ETH per wallet
        </Checkbox>

        <Checkbox readOnly checked={!!tokensSold && hasContract}>
          Tokens Sold: {tokensSold ? Number(tokensSold).toLocaleString('en-US') : '0'} {"/"} {Number(TOTAL_SALE_AMOUNT).toLocaleString('en-US')} {TOKEN_SYMBOL}
        </Checkbox>

        <Checkbox readOnly checked={eligible}>
          <Tooltip text="Every wallet interacting with Round 1&2 of the Airdrop" delay={300}>
            <u>Eligibility Criteria</u>
          </Tooltip>
        </Checkbox>

        <Checkbox
          readOnly
          checked={!!(
            caller &&
            isEthAddress(beneficiary) &&
            caller.toLowerCase() !== beneficiary.toLowerCase()
          )}
        >
          <Tooltip text="Enter any whitelisted address to buy on its behalf. Every wallet can do this once and tokens go to the whitelisted address." delay={300}>
            <u>Delegate Purchase</u>
          </Tooltip>
        </Checkbox>
      </Fieldset>

      <div className="flex flex-col items-center justify-center mt-2">
        <Fieldset legend={!isConnected ? "Check Eligibility" : "Recipient"} width="350px">
          <Input
            placeholder="Wallet Address"
            value={beneficiary}
            onChange={e => { setBeneficiary(e.target.value) }}
            className="w-80"
          /></Fieldset>

        <div className="flex items-center justify-center mb-2 mt-2">
          <Input
            placeholder="0.1"
            value={ethAmount}
            onChange={e => {
              const value = e.target.value;
              if (value === '' || (parseFloat(value) <= parseFloat(MAX_ALLOCATION) && parseFloat(value) >= 0)) {
                setEthAmount(value);
              }
            }}
            className="w-[45px] mr-2"
            type="number"
            step="0.01"
            max={MAX_ALLOCATION}
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

        {beneficiary && !alreadyPurchased && !delegateUsed && (
          !validAddr ? (
            <p className="text-center text-xs mt-2 mb-0 text-red-500">
              Input is not an Ethereum address.
            </p>
          ) : !eligible ? (
            <p className="text-center text-xs mt-2 mb-0 text-red-500">
              Wallet is not on the whitelist.
            </p>
          ) : (
            <p className="text-center text-xs mt-2 mb-0 text-green-700">
              Wallet is on the whitelist!
            </p>
          )
        )}
      </div>
    </div>
  );
}
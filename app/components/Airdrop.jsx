'use client';

import { useState, useEffect } from 'react';
import {
  Tabs,
  Tab,
  Button,
  Input,
  Frame,
  Fieldset,
  Checkbox,
  Tooltip,
  Cursor
} from '@react95/core';
import ConnectButton95 from './ConnectButton95';
import {
  useAccount,
  useReadContract,
  useSimulateContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';

import proofsRound1 from '../proofs_22849225.js';
import proofsRound2 from '../proofs_round2.js';
import { AIRDROP_ABI } from '../abi/airdropAbi';
import { FAUCET_ABI } from '../abi/faucetAbi';

/* ─ constants / abi ─ */
const TOKEN_SYMBOL = 'MEME';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MEME_AIRDROP_ADDRESS;
const FAUCET_ADDRESS = process.env.NEXT_PUBLIC_MEME_FAUCET_ADDRESS;

const PROOF_MAPS = [
  Object.fromEntries(proofsRound1.map(({ address, proof }) => [address.toLowerCase(), proof])),
  Object.fromEntries(proofsRound2.map(({ address, proof }) => [address.toLowerCase(), proof])),
];

function getProofForAddress(addr, roundId) {
  if (!addr || roundId === undefined) return [];
  const map = PROOF_MAPS[roundId];
  return map?.[addr.toLowerCase()] ?? [];
}

function formatTime(t) {
  const d = Math.floor(t / 86400);
  const h = Math.floor((t % 86400) / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${d}d ${h}h ${m}m ${s}s`;
}

function RoundTab({ roundId }) {
  const { address, isConnected } = useAccount();
  const qc = useQueryClient();

  /* round data ─ always read */
  const { data: round, queryKey: roundKey } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AIRDROP_ABI,
    functionName: 'rounds',
    args: [roundId],
  });

  /* safe defaults so subsequent hooks run every render */
  const regEnds = round ? Number(round[0]) : 0;
  const sharePerWallet = round ? round[3] : 0n;
  const registrantCount = round ? Number(round[4]) : 0;
  const closed = round ? round[5] : false;

  /* user-specific state (hooks always called) */
  const { data: isReg, queryKey: regKey } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AIRDROP_ABI,
    functionName: 'registered',
    args: [roundId, address],
    enabled: !!address,
  });
  const { data: isClaim, queryKey: clKey } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AIRDROP_ABI,
    functionName: 'claimed',
    args: [roundId, address],
    enabled: !!address,
  });

  /* manual eligibility check UI state */
  const [checkAddr, setCheckAddr] = useState('');
  const [checkRes, setCheckRes] = useState(null); // { eligible, claimed }

  /* simulate / write */
  const proof = getProofForAddress(address, roundId);
  const eligible = proof.length > 0;

  const { data: simReg } = useSimulateContract({
    address: CONTRACT_ADDRESS,
    abi: AIRDROP_ABI,
    functionName: 'register',
    args: [roundId, proof],
    account: address,
    enabled: !!address && proof.length > 0,
  });
  const { data: simClm } = useSimulateContract({
    address: CONTRACT_ADDRESS,
    abi: AIRDROP_ABI,
    functionName: 'claim',
    args: [roundId],
    account: address,
    enabled: !!address,
  });

  const { writeContract: wReg, data: regHash } = useWriteContract();
  const { writeContract: wClm, data: clmHash } = useWriteContract();
  const { isSuccess: regOK } = useWaitForTransactionReceipt({ hash: regHash });
  const { isSuccess: clmOK } = useWaitForTransactionReceipt({ hash: clmHash });

  /* invalidate on tx success */
  useEffect(() => {
    if (regOK || clmOK) {
      qc.invalidateQueries({ queryKey: roundKey });
      if (address) {
        qc.invalidateQueries({ queryKey: regKey });
        qc.invalidateQueries({ queryKey: clKey });
      }
    }
  }, [regOK, clmOK, address, roundKey, regKey, clKey, qc]);

  /* countdown timer */
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  const regOpen = !closed && now < regEnds;
  const timeLeft = formatTime(Math.max(regEnds - now, 0));
  const regPend = !!regHash && !regOK;
  const clmPend = !!clmHash && !clmOK;

  /* button handlers */
  const onRegister = () => {
    if (!proof.length) return alert('Not whitelisted.');
    if (!simReg?.request) return alert('Simulation failed.');
    wReg(simReg.request);
  };

  const onClaim = () => {
    if (!simClm?.request) return alert('Round not claimable yet.');
    wClm(simClm.request);
  };

  const onCheck = async () => {
    const p = getProofForAddress(checkAddr, roundId); // pass roundId!
    const eligible = p.length > 0;
    let claimed = false; // you can implement real claim checks later
    setCheckRes({ eligible, claimed });
  };

  /* ───────────────────────── JSX ───────────────────────── */
  return (
    <div>
      <Fieldset className='flex flex-col' legend="Airdrop Status" width="350px">
        <Checkbox readOnly checked={!!regOpen}>
          {regOpen ? `Registration ends in ${timeLeft}` : 'Round closed'}
        </Checkbox>
        <Checkbox readOnly checked={!!registrantCount}>Registrant Count: {registrantCount}</Checkbox>
        <Checkbox readOnly checked>Pool allocation: 34,521 MEME (5%)</Checkbox>
        <Checkbox readOnly checked><Tooltip text="Holders of ≥ 100 WAAC, 15 WMC, 1000 btc, 100 FART and 100 MUTATIO/FLIES. Snapshot at block 22849225." delay={300}><u>Eligibility Criteria</u></Tooltip></Checkbox>
      </Fieldset>

      {regOpen && (
        <div className="flex items-center justify-center">
          <Frame variant="well" p={2}>

          </Frame>
        </div>
      )}

      {!isConnected ? (
        <>
          <div className="flex flex-col items-center space-y-2 mt-4 mb-1">
            <Input
              placeholder="Wallet Address"
              value={checkAddr}
              onChange={(e) => setCheckAddr(e.target.value)}
              className="w-80"
            />
            <Button className="w-80" onClick={onCheck} style={{ cursor: `url(${Cursor.Pointer}), pointer` }}>
              Check Eligibility
            </Button>
            {checkRes && (
              <p className={`text-center text-xs mt-1 mb-0 ${checkRes.eligible ? 'text-green-700' : 'text-red-500'
                }`}>
                {checkRes.eligible
                  ? 'Eligible! Connect your wallet to register.'
                  : 'Not eligible to register.'}
              </p>
            )}
          </div>
        </>
      ) : regOpen ? (
        <>
          <div className="flex flex-col items-center justify-center mt-4">
            <Button
              disabled={isReg || regPend || !eligible}
              onClick={onRegister}
              className="w-60"
              style={{ cursor: `url(${Cursor.Pointer}), pointer` }}
            >
              {isReg
                ? 'Already Registered'
                : !eligible
                  ? 'Register'
                  : regPend
                    ? 'Pending…'
                    : 'Register'}
            </Button>

            {/* helper caption */}
            {isReg ? (
              <p className="text-center text-xs mt-2 mb-2">
                Waiting for the round to close...
              </p>
            ) : (
              <p className={`text-center text-xs mt-2 mb-2 ${eligible ? 'text-green-700' : 'text-red-500'
                }`} >
                {eligible
                  ? 'Your wallet is on the whitelist.'
                  : 'Your wallet is NOT on the whitelist.'}
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          {isConnected && !regOpen && (
            <>
              {isReg ? (
                <>
                  <div className="flex flex-col items-center justify-center mt-0">
                    <p className="text-sm text-center font-semibold">
                      Round has ended. Claim your share!
                    </p>

                    <Button
                      disabled={isClaim || clmPend}
                      onClick={onClaim}
                      className="w-60"
                      style={{ cursor: `url(${Cursor.Pointer}), pointer` }}
                    >
                      {isClaim ? 'Already Claimed' : clmPend ? 'Pending…' : 'Claim'}
                    </Button>

                    {!closed && !isClaim && (
                      <p className="text-center text-xs text-gray-500 mt-2">
                        Your claim will automatically close the round.
                      </p>
                    )}

                    {closed && (
                      <p className="text-xs text-center mt-2">
                        Share per wallet: {sharePerWallet.toString()} {TOKEN_SYMBOL}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-sm text-center font-semibold mb-1">
                      Round has ended.
                    </p>
                    <p className="text-sm text-center text-red-500 my-1">
                      {proof.length > 0
                        ? 'You didn’t register in time.'
                        : 'Your wallet was not on the whitelist.'}
                    </p>
                  </div>
                </>
              )}
            </>
          )}


        </>
      )}
    </div>
  );
}

/* -------------------------- Faucet tab -------------------------- */
function FaucetTab() {
  const { address, isConnected } = useAccount();
  const qc = useQueryClient();

  /* reads */
  const { data: open } = useReadContract({ address: FAUCET_ADDRESS, abi: FAUCET_ABI, functionName: 'faucetOpen' });
  const { data: limit } = useReadContract({ address: FAUCET_ADDRESS, abi: FAUCET_ABI, functionName: 'limitPerWallet' });
  const { data: balance } = useReadContract({ address: FAUCET_ADDRESS, abi: FAUCET_ABI, functionName: 'availableBalance' });
  const { data: claimed } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: 'hasClaimed',
    args: [address],
    enabled: !!address,
  });

  /* simulate + write */
  const { data: simClaim } = useSimulateContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: 'claim',
    account: address,
    enabled: isConnected && open && !claimed && balance && balance > 0n,
  });

  const { writeContract: claim, data: claimHash } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: claimHash });

  /* refresh faucet reads after successful claim */
  useEffect(() => {
    if (isSuccess) {
      qc.invalidateQueries({ address: FAUCET_ADDRESS });
    }
  }, [isSuccess, qc]);

  const onClaim = () => {
    if (!simClaim?.request) return;
    claim(simClaim.request);
  };

  const disabled = !isConnected || !open || claimed || !balance || balance === 0n;

  return (
    <div className="space-y-2">
      <Fieldset className='flex flex-col' legend="Faucet Status" width="300px">
        <Checkbox readOnly checked={!!open}>
          Faucet {open ? 'open' : 'closed'}
        </Checkbox>
        <Checkbox readOnly checked={!!(balance && limit && balance >= limit)}>Faucet balance: {balance?.toString()}{' '}{TOKEN_SYMBOL}</Checkbox>
      </Fieldset>

      <Button
        disabled={disabled}
        className="w-full"
        onClick={onClaim}
        style={{ cursor: `url(${Cursor.Pointer}), pointer` }}
      >
        {claimed
          ? 'Already Claimed'
          : !open
            ? 'Faucet Closed'
            : disabled
              ? 'Connect Wallet'
              : 'Claim'}
      </Button>
    </div>
  );
}


export default function Airdrop() {
  /* how many rounds are on-chain? */
  const { data: roundsCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AIRDROP_ABI,
    functionName: 'roundsCount',
  });

  const [defaultTab, setDefaultTab] = useState(null);
  const [activeTab, setActiveTab] = useState('faucet'); // default tab

  const TAB_ADDRESS = activeTab === 'faucet' ? FAUCET_ADDRESS : CONTRACT_ADDRESS;


  useEffect(() => {
    if (roundsCount !== undefined) {
      setDefaultTab(Number(roundsCount) > 1 ? 'Round 2' : 'Round 1');
    }
  }, [roundsCount]);

  const rounds = Number(roundsCount || 0);


  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: "relative", minWidth: 380 }}>
      <ConnectButton95 />
      <div className="mt-2">
        <Tabs width="100%" defaultActiveTab={defaultTab} onChange={(title) => {
          if (title === 'Faucet') setActiveTab('faucet');
          else setActiveTab('airdrop');
        }}>
          <Tab title="Faucet" style={{ cursor: `url(${Cursor.Pointer}), pointer` }}>
            <FaucetTab />
          </Tab>

          <Tab title="Round 1" style={{ cursor: `url(${Cursor.Pointer}), pointer` }}>
            <RoundTab roundId={0} />
          </Tab>

          <Tab
            title={
              rounds >= 2
                ? 'Round 2'
                : <Tooltip text="soon!" delay={300} style={{ cursor: `url(${Cursor.NotAllowed}), not-allowed` }}>Round 2</Tooltip>
            }
            disabled={rounds < 2}
            style={rounds >= 2 ? { cursor: `url(${Cursor.Pointer}), pointer` } : { cursor: `url(${Cursor.NotAllowed}), not-allowed` }}
          >
            <RoundTab roundId={1} />
          </Tab>
        </Tabs>
      </div>

      <div className="flex flex-row justify-center mt-2 mb-0">
        <span className="mr-1">Contract:</span>
        <a
          href={`https://etherscan.io/address/${TAB_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>[{TAB_ADDRESS.slice(0, 6)}…{TAB_ADDRESS.slice(-4)}]</span>
        </a>
      </div>

    </div>
  );
}
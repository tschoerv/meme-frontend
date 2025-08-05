'use client';

import { useState, useEffect, useRef } from 'react';
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
import { isEthAddress } from '../utils/isAddress.js';

import proofsRound1 from '../proofs_22849225.js';
import proofsRound2 from '../proofs_23031420.js';
import { AIRDROP_ABI } from '../abi/airdropAbi';
import { FAUCET_ABI } from '../abi/faucetAbi';
import { CLAIM_V2_ABI } from '../abi/airdropClaimAbi.js';

/* ─ constants / abi ─ */
const TOKEN_SYMBOL = 'MEME';
const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MEME_AIRDROP_ADDRESS;
const FAUCET_ADDRESS = process.env.NEXT_PUBLIC_MEME_FAUCET_ADDRESS;
const CLAIM_V2_ADDRESS = process.env.NEXT_PUBLIC_MEME_AIRDROP_V2_ADDRESS;  // MemeAirdropClaim


const PROOF_MAPS = [
  Object.fromEntries(proofsRound1.map(({ address, proof }) => [address.toLowerCase(), proof])),
  Object.fromEntries(proofsRound2.map(({ address, proof }) => [address.toLowerCase(), proof])),
];

function getProofForAddress(addr, roundId) {
  if (!addr || roundId === undefined) return [];
  const map = PROOF_MAPS[roundId];
  return map?.[addr.toLowerCase()] ?? [];
}

function getProofForV2(addr) {
  if (!addr) return [];
  const row = proofsRound2.find(p => p.address.toLowerCase() === addr.toLowerCase());
  return row ? row.proof : [];
}


function formatTime(t) {
  const d = Math.floor(t / 86400);
  const h = Math.floor((t % 86400) / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${d}d ${h}h ${m}m ${s}s`;
}

/* ------------------------- Round‑2 (delegate claim) ------------------------- */

function Round2ClaimTab() {
  /* ───────────── constants ───────────── */
  const TOTAL_POOL = 34_500n;            // 34 500 MEME
  const EARLY_BUFFER = 12;                 // UI flips 12 s early
  const PRESET_OPENS_AT = 1754323200;

  /* ─────────── React + wagmi state ─────────── */
  const { address: caller, isConnected } = useAccount();
  const qc = useQueryClient();
  const [beneficiary, setBeneficiary] = useState(caller ?? '');
  const [checked, setChecked] = useState(false);
  const [totalClaimed, setTotalClaimed] = useState('0');
  const [nowTs, setNowTs] = useState(() => Math.floor(Date.now() / 1000));

  const hasContract =
    CLAIM_V2_ADDRESS &&
    /^0x[0-9a-fA-F]{40}$/.test(CLAIM_V2_ADDRESS) &&         // looks like 0x…
    !/^0x0{40}$/i.test(CLAIM_V2_ADDRESS);                    // but not 0x000…000


  /* local 1-s ticker for countdown */
  useEffect(() => {
    const id = setInterval(() => setNowTs(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  /* ─────────── on-chain reads (guarded by hasContract) ─────────── */
  const { data: isPaused } = useReadContract({
    address: CLAIM_V2_ADDRESS,
    abi: CLAIM_V2_ABI,
    functionName: 'paused',
    enabled: hasContract,
  });

  const { data: opensAt } = useReadContract({
    address: CLAIM_V2_ADDRESS,
    abi: CLAIM_V2_ABI,
    functionName: 'claimOpensAt',
    enabled: hasContract,
  });

  const { data: alreadyClaimed, queryKey: claimedKey } = useReadContract({
    address: CLAIM_V2_ADDRESS,
    abi: CLAIM_V2_ABI,
    functionName: 'claimed',
    args: [beneficiary],
    enabled: hasContract && !!beneficiary,
  });

  const { data: slotUsed } = useReadContract({
    address: CLAIM_V2_ADDRESS,
    abi: CLAIM_V2_ABI,
    functionName: 'delegateUsed',
    args: [caller],
    enabled: hasContract && !!caller,
  });

  const { data: poolBal, queryKey: balKey } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: [{ name: 'balanceOf', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }],
    functionName: 'balanceOf',
    args: [CLAIM_V2_ADDRESS],
    enabled: hasContract && !!TOKEN_ADDRESS,
  });

  /* ─────────── derived counters ─────────── */
  useEffect(() => {
    if (!hasContract) {
      // contract not deployed yet → nothing claimed
      setTotalClaimed('0');
      return;
    }

    if (poolBal !== undefined) {
      const tokensClaimed = TOTAL_POOL - poolBal;
      setTotalClaimed(Number(tokensClaimed).toLocaleString('en-US'));
    }
  }, [hasContract, poolBal, TOTAL_POOL]);

  /* prefills */
  useEffect(() => {
    if (isConnected && caller) setBeneficiary(caller);
  }, [isConnected, caller]);

  /* ─────────── round state flags ─────────── */
  const hasFunds = hasContract && poolBal !== undefined && poolBal >= 100n;
  const openTime = hasContract ? (opensAt ? Number(opensAt) : 0) : PRESET_OPENS_AT;

  const isOpen = hasContract && hasFunds && !isPaused && openTime !== 0 && nowTs >= (openTime - EARLY_BUFFER);
  const beforeOpen = openTime !== 0 && nowTs < (openTime - EARLY_BUFFER);

  const timeLeft = formatTime(Math.max(openTime - nowTs, 0));

  /* ─────────── whitelist proof ─────────── */
  const proof = getProofForV2(beneficiary);
  const validAddr = isEthAddress(beneficiary);
  const eligible = validAddr && proof.length > 0;

  /* ─────────── simulation (only if contract exists) ─────────── */
  const {
    data: simClaim,
    status: simStatus,
    error: simError,
    refetch: refetchSim,
  } = useSimulateContract({
    address: CLAIM_V2_ADDRESS,
    abi: CLAIM_V2_ABI,
    functionName: 'claim',
    args: [beneficiary, proof],
    account: caller,
    enabled: false,
  });

  /* retry sim once per second while round open but sim reverts w/ claim-not-open */
  const lastTryRef = useRef(0);
  useEffect(() => {
    if (!hasContract) return;

    const claimNotOpen =
      simStatus === 'error' &&
      /claim not open/i.test(simError?.shortMessage || '');

    const needRetry =
      isOpen && isConnected && eligible && !alreadyClaimed && !slotUsed && claimNotOpen;

    const now = Date.now();
    if (needRetry && now - lastTryRef.current > 1000) {
      lastTryRef.current = now;
      refetchSim();
    }
  }, [
    hasContract, isOpen, isConnected, eligible,
    alreadyClaimed, slotUsed, simStatus, simError, refetchSim,
  ]);

  /* ─────────── write tx & pending flag ─────────── */
  const { writeContract, data: txHash } = useWriteContract();
  const { isSuccess: mined } = useWaitForTransactionReceipt({ hash: txHash });
  const claimPend = !!txHash && !mined;

  const canClaim =
    hasContract &&
    isConnected &&
    isOpen &&
    eligible &&
    !alreadyClaimed &&
    !slotUsed &&
    simStatus === 'success' &&
    !!simClaim?.request &&
    !claimPend;

  const claimLabel =
    claimPend ? 'Pending…' :
      alreadyClaimed ? 'Already Claimed' :
        slotUsed ? 'Delegate Slot Used' :
          !eligible ? 'Not Eligible' :
            !hasFunds ? 'Pool is Empty' :
              caller && beneficiary && caller.toLowerCase() !== beneficiary.toLowerCase()
                ? 'Delegate Claim'
                : 'Claim';

  const handleClaim = () => {
    if (simClaim?.request) writeContract(simClaim.request);
  };

  /* refresh counters on success */
  useEffect(() => {
    if (mined) {
      qc.invalidateQueries({ queryKey: balKey });
      qc.invalidateQueries({ queryKey: claimedKey });
    }
  }, [mined, balKey, claimedKey, qc]);

  /* ─────────────────────── UI ─────────────────────── */
  const showManual = !hasContract || !isOpen || !isConnected;
  const showClaim = hasContract && isOpen && isConnected;

  return (
    <div style={{ minWidth: 330 }}>
      <Fieldset legend="Airdrop Status" width="350px" className="flex flex-col mb-3">
        <Checkbox readOnly checked={isOpen}>
          {isOpen
            ? 'Round Open'
            : beforeOpen
              ? `Round Opens in ${timeLeft}`
              : 'Round Closed'}
        </Checkbox>

        <Checkbox readOnly checked={hasContract}>
          Amount Claimed: {totalClaimed} / 34,500 {TOKEN_SYMBOL}
        </Checkbox>

        <Checkbox readOnly checked={eligible}>
          <Tooltip text="Same as Round 1 + all holders of Etheria, PixelMap, Peperium, CurioCards, v1&v2 Punks and MoonCats at block 23031420." delay={300}>
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
          <Tooltip text="Enter any whitelisted address to claim on its behalf. Every wallet can do this once and tokens go to the whitelisted address." delay={300}>
            <u>Delegate Claim</u>
          </Tooltip>
        </Checkbox>
      </Fieldset>

      {/* ───── manual checker (always when no contract, or round not open) ───── */}
      {showManual && (
        <div className="flex flex-col items-center space-y-2">
          <Input
            placeholder="Wallet Address"
            value={beneficiary}
            onChange={e => { setBeneficiary(e.target.value); setChecked(false); }}
            className="w-80"
          />

          <Button
            className="w-80"
            onClick={() => setChecked(true)}
            style={{ cursor: `url(${Cursor.Pointer}), pointer` }}
          >
            Check Eligibility
          </Button>

          {checked && beneficiary && (
            <p className={`text-center text-xs mt-1 mb-0 ${validAddr && eligible ? 'text-green-700' : 'text-red-500'}`}>
              {validAddr
                ? eligible
                  ? 'Wallet is on the whitelist.'
                  : 'Wallet is not on the whitelist.'
                : 'Input is not an Ethereum address.'}
            </p>
          )}
        </div>
      )}

      {/* ───── claim UI (only when contract deployed & round open) ───── */}
      {showClaim && (
        <div className="flex flex-col items-center justify-center mt-2">
          <Input
            placeholder="Wallet Address"
            value={beneficiary}
            onChange={e => { setBeneficiary(e.target.value); setChecked(false); }}
            className="w-80 mb-2"
          />

          <Button
            disabled={!canClaim}
            onClick={handleClaim}
            className="w-80"
            style={{ cursor: `url(${Cursor.Pointer}), pointer` }}
          >
            {claimLabel}
          </Button>

          {beneficiary && !alreadyClaimed && !slotUsed && (
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
                Eligible to claim 100 MEME!
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
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

  /* countdown timer */
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const regOpen = !closed && now < regEnds;
  const timeLeft = formatTime(Math.max(regEnds - now, 0));

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
  const validCheckAddr = isEthAddress(checkAddr);

  /* simulate / write */
  const proof = getProofForAddress(address, roundId);
  const eligible = proof.length > 0;

  const { data: simReg } = useSimulateContract({
    address: CONTRACT_ADDRESS,
    abi: AIRDROP_ABI,
    functionName: 'register',
    args: [roundId, proof],
    account: address,
    query: {
      enabled:
        !!address &&           // wallet connected
        regOpen &&             // reg-window open
        eligible &&            // has proof
        !isReg                 // not yet registered
    },
  });

  const { data: simClm } = useSimulateContract({
    address: CONTRACT_ADDRESS,
    abi: AIRDROP_ABI,
    functionName: 'claim',
    args: [roundId],
    account: address,
    query: {
      enabled:
        !!address &&    // wallet connected
        !regOpen &&    // registration is OVER
        isReg &&    // wallet did register
        !isClaim &&    // hasn’t claimed yet
        eligible               // proof exists
    },
  });

  const { writeContract: wReg, data: regHash } = useWriteContract();
  const { writeContract: wClm, data: clmHash } = useWriteContract();
  const { isSuccess: regOK } = useWaitForTransactionReceipt({ hash: regHash });
  const { isSuccess: clmOK } = useWaitForTransactionReceipt({ hash: clmHash });

  const regPend = !!regHash && !regOK;
  const clmPend = !!clmHash && !clmOK;

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
    if (!validCheckAddr) {
      setCheckRes({ eligible: false, invalid: true });
      return;
    }
    const p = getProofForAddress(checkAddr, roundId);
    const eligible = p.length > 0;
    setCheckRes({ eligible, invalid: false });
  };

  /* ───────────────────────── JSX ───────────────────────── */
  return (
    <div>
      <Fieldset className='flex flex-col' legend="Airdrop Status" width="350px">
        <Checkbox readOnly checked={!!regOpen}>
          {regOpen ? `Registration Ends in ${timeLeft}` : 'Round Closed'}
        </Checkbox>
        <Checkbox readOnly checked={!!registrantCount}>Registrant Count: {registrantCount}</Checkbox>
        <Checkbox readOnly checked>Pool allocation: 34,521 MEME (5%)</Checkbox>
        <Checkbox readOnly checked={eligible}><Tooltip text="Holders of ≥ 100 WAAC, 15 WMC, 1000 btc, 100 FART and 100 MUTATIO/FLIES. Snapshot at block 22849225." delay={300}><u>Eligibility Criteria</u></Tooltip></Checkbox>
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
              onChange={(e) => {
                setCheckAddr(e.target.value);   // update text
                setCheckRes(null);              // clear previous result
              }}
              className="w-80"
            />
            <Button className="w-80" onClick={onCheck} style={{ cursor: `url(${Cursor.Pointer}), pointer` }}>
              Check Eligibility
            </Button>
            {checkRes && checkAddr && (
              <p className={`text-center text-xs mt-1 mb-0 ${checkRes.eligible ? 'text-green-700' : 'text-red-500'
                }`}>
                {checkRes.invalid
                  ? 'Input is not an Ethereum address.'
                  : checkRes.eligible
                    ? 'Wallet is on the whitelist.'
                    : 'Wallet is not on the whitelist.'}
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
              <p className="text-center text-xs mt-2 mb-0">
                Waiting for the round to close...
              </p>
            ) : (
              <p className={`text-center text-xs mt-2 mb-0 ${eligible ? 'text-green-700' : 'text-red-500'
                }`} >
                {eligible
                  ? 'Your wallet is on the whitelist.'
                  : 'Your wallet is not on the whitelist.'}
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

  const [activeTab, setActiveTab] = useState('round2'); // default tab

  const TAB_ADDRESS = activeTab === 'faucet' ? FAUCET_ADDRESS : activeTab === 'round1' ? CONTRACT_ADDRESS : CLAIM_V2_ADDRESS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: "relative", minWidth: 380 }}>
      <ConnectButton95 />
      <div className="mt-2">
        <Tabs defaultActiveTab="Round 2" onChange={(title) => {
          if (title === 'Faucet') setActiveTab('faucet');
          else if (title === 'Round 1') setActiveTab('round1');
          else setActiveTab('round2');
        }}>
          <Tab title="Faucet" style={{ cursor: `url(${Cursor.Pointer}), pointer` }}>
            <FaucetTab />
          </Tab>

          <Tab title="Round 1" style={{ cursor: `url(${Cursor.Pointer}), pointer` }}>
            <RoundTab roundId={0} />
          </Tab>

          <Tab
            title="Round 2"
            style={{ cursor: `url(${Cursor.Pointer}), pointer` }}
          >
            <Round2ClaimTab />
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
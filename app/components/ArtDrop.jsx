'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button, Fieldset, Checkbox, Tooltip, Tabs, Tab, Cursor, Frame
} from '@react95/core';
import {
  useAccount,
  useReadContract,
  useSimulateContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import ConnectButton95 from './ConnectButton95';
import Image from "next/image";
import { ART_DROP_ABI } from '../abi/artDropAbi.js';
import { ERC1155_ABI } from '../abi/ERC1155Abi.js';
import { ARTWORKS, PRICE_SEASON_1, DISCOUNT_PCT_SEASON_1 } from '../config/artworks';

/* ───────────────── Config ───────────────── */
const ART_DROP_ADDR = process.env.NEXT_PUBLIC_ART_DROP_ADDRESS;
const MEME_ART_ADDR = process.env.NEXT_PUBLIC_MEME_ART_ADDRESS;

/* ───────────────── Utils ───────────────── */
const prettyWei = (w) => {
  try {
    const s = w.toString().padStart(19, '0');
    const whole = s.slice(0, -18) || '0';
    const frac = s.slice(-18).replace(/0+$/, '').slice(0, 6);
    return frac ? `${whole}.${frac}` : whole;
  } catch { return '0'; }
};
const fmtTime = (seconds) => {
  const s = Math.max(0, seconds | 0);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return `${d}d ${h}h ${m}m ${r}s`;
};

/* ───────────────── Tab body component ───────────────── */
function CardPanel({ id, isActive, isPaused }) {
  const { address: caller, isConnected } = useAccount();
  const [amountStr, setAmountStr] = useState('1');
  const [nowTs, setNowTs] = useState(() => Math.floor(Date.now() / 1000));

  const [pendingMint, setPendingMint] = useState(null); // snapshot before tx
  const [mintSuccess, setMintSuccess] = useState(null); // store confirmed tx

  const qc = useQueryClient();

  useEffect(() => {
    const t = setInterval(() => setNowTs(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const hasContract = useMemo(
    () => ART_DROP_ADDR && /^0x[0-9a-fA-F]{40}$/.test(ART_DROP_ADDR) && !/^0x0{40}$/i.test(ART_DROP_ADDR),
    []
  );

  // Artwork state
  const art = ARTWORKS[id] || null;
  const isVideo = !!art?.src && /\.mp4(\?.*)?$/i.test(art.src);
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);

  // Reset mute when switching cards / sources
  useEffect(() => {
    setMuted(true);
    if (videoRef.current) {
      videoRef.current.muted = true;
      // attempt to play (autoplay allowed because muted)
      videoRef.current.play().catch(() => { });
    }
  }, [id, art?.src, isActive]);

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      if (videoRef.current) {
        videoRef.current.muted = next;
        if (!next) {
          // user-initiated play with sound
          videoRef.current.play().catch(() => { });
        }
      }
      return next;
    });
  };


  // Read sale config for this card
  const { data: saleTuple } = useReadContract({
    address: ART_DROP_ADDR,
    abi: ART_DROP_ABI,
    functionName: 'sale',
    args: [id],
    enabled: hasContract && isActive,
  });


  // Normalize both shapes (named OR indexed)
  const priceRaw = saleTuple && (saleTuple.priceWei ?? saleTuple[0]);
  const stRaw = saleTuple && (saleTuple.startTime ?? saleTuple[1]);
  const maxRaw = saleTuple && (saleTuple.maxPerTx ?? saleTuple[2]);

  const startTime = Number(stRaw ?? 0);
  const maxPerTx = Number(maxRaw ?? 0);
  const priceWeiRaw = BigInt(priceRaw ?? 0n);

  const priceSet = priceWeiRaw > 0n;

  const saleOpen = startTime !== 0 && nowTs >= startTime;
  const saleBefore = startTime !== 0 && nowTs < startTime;
  const saleClosed = startTime === 0;
  const opensIn = saleBefore ? fmtTime(startTime - nowTs) : '';

  // Price for caller (handles discount)
  const { data: unitPrice } = useReadContract({
    address: ART_DROP_ADDR,
    abi: ART_DROP_ABI,
    functionName: 'unitPriceFor',
    args: [caller ?? '0x0000000000000000000000000000000000000000', id],
    enabled: hasContract && isActive && priceSet,
  });

  const price = unitPrice ? BigInt(unitPrice) : 0n;

  const discounted = price > 0n && price < priceWeiRaw;

  // Read inventory
  const { data: inv, queryKey: balKey } = useReadContract({
    address: MEME_ART_ADDR, abi: ERC1155_ABI, functionName: 'balanceOf',
    args: [ART_DROP_ADDR, id],
    enabled: hasContract && isActive,
  });
  const inventory = Number(inv ?? 0);

  const soldOut = inventory === 0;

  // Amount & totals
  const amountNum = Math.max(0, Math.floor(Number(amountStr || '0')));
  const amountOk =
    amountNum > 0 &&
    (maxPerTx === 0 || amountNum <= maxPerTx) &&
    amountNum <= Math.max(1, inventory);

  const totalValue = amountOk ? price * BigInt(amountNum) : 0n;

  // Simulate & buy
  const {
    data: sim,
    status: simStatus,
    error: simError,
    refetch: refetchSim,
  } = useSimulateContract({
    address: ART_DROP_ADDR,
    abi: ART_DROP_ABI,
    functionName: 'buyTo',
    args: [id, BigInt(Math.max(1, amountNum || 0)), caller ?? '0x0000000000000000000000000000000000000000'],
    value: totalValue,
    account: caller,
    enabled: hasContract && isActive && isConnected && amountOk && saleOpen && !isPaused,
  });

  const lastTryRef = useRef(0);
  useEffect(() => {
    //shortMessage for buyTo when not yet open
    const msg = simError?.shortMessage || simError?.message || '';
    const looksClosed = simStatus === 'error' && /sale closed/i.test(msg);

    const shouldRetry =
      hasContract &&
      isActive &&
      isConnected &&
      amountOk &&
      saleOpen &&       // UI clock says "open"
      !isPaused &&
      looksClosed;      // chain still reports "sale closed"

    const now = Date.now();
    if (shouldRetry && now - lastTryRef.current > 500) {
      lastTryRef.current = now;
      refetchSim();
    }
  }, [
    hasContract, isActive, isConnected, amountOk, saleOpen, isPaused, simStatus, simError, refetchSim,
  ]);


  const { writeContract, data: txHash } = useWriteContract();
  const { isSuccess: mined } = useWaitForTransactionReceipt({ hash: txHash });
  const pending = !!txHash && !mined;

  const canBuy =
    hasContract && isActive && isConnected && saleOpen && !isPaused &&
    amountOk && price > 0n && totalValue > 0n &&
    simStatus === 'success' && !!sim?.request && !pending && inventory > 0;

  const buyLabel =
    pending ? 'Pending…' :
      !isConnected ? 'Connect Wallet' :
        isPaused ? 'Paused' :
          saleBefore ? 'Starts Soon' :
            saleClosed ? 'Closed' :
              inventory === 0 ? 'Sold Out' :
                !amountOk ? 'Enter Valid Amount' :
                  'Buy';

  const handleBuy = () => {
    if (sim?.request) {
      setPendingMint({ id, amount: amountNum, totalWei: totalValue });
      writeContract(sim.request);
    }
  };

  // When mined, show success
  useEffect(() => {
    if (mined && txHash && pendingMint && pendingMint.id === id) {
      setMintSuccess({
        ...pendingMint,
        hash: txHash,
      });
      setPendingMint(null);

      qc.invalidateQueries({ queryKey: balKey });
    }
  }, [mined, txHash, pendingMint, id, qc, balKey]);

  const handleShareOnX = () => {
    if (!art?.src) return;

    const osUrl = `https://opensea.io/item/ethereum/${MEME_ART_ADDR}/${id}`

    const text = `Just minted “${art.title}” by @${art.twitter}!\n$MEME Art Drop — Season 1: Discovery 🎨\n@Memecoin2016`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(osUrl)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };


  return (
    <div style={{ minWidth: 360 }}>
      <Fieldset legend={`Mint Status`} width="360px" className="flex flex-col mb-3">
        <Checkbox readOnly checked={saleOpen && !isPaused && !soldOut}>
          {saleClosed
            ? 'Sale Closed'
            : saleBefore
              ? `Opens in ${opensIn}`
              : isPaused
                ? 'Paused'
                : soldOut
                  ? 'Sale Closed'
                  : 'Sale Open'}
        </Checkbox>

        <Checkbox readOnly checked={!soldOut}>
          {`Available: ${inventory}/100`}
        </Checkbox>

        <Checkbox readOnly checked={discounted}>
          <Tooltip text={`Hold 100 MEME to receive a ${DISCOUNT_PCT_SEASON_1}% discount`} delay={200}>
            <u>{`MEME Holders Discount: ${DISCOUNT_PCT_SEASON_1}%`}</u>
          </Tooltip>
        </Checkbox>
      </Fieldset>

      {/* Artwork preview */}
      {art?.src && (
        <div className="flex flex-col items-center mb-3" style={{ minWidth: 360 }}>
          <div
            className="overflow-hidden"
            style={{
              position: 'relative',
              width: 320,
              height: 213,
              border: '1px solid var(--material)',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
              background: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isVideo ? (
              <video
                key={art.src}
                ref={videoRef}
                src={art.src}
                poster={art.poster}
                width={320}
                height={213}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                muted={muted}
                loop
                autoPlay
                playsInline
                controls={false}
              />
            ) : (
              <Image
                src={art.thumb}
                alt={`${art.title} by ${art.artist}`}
                width={320}
                height={213}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
              />
            )}

            {/* Unmute/Mute button for videos */}
            {isVideo && (
              <div
                role="button"
                aria-label={muted ? 'Unmute' : 'Mute'}
                title={muted ? 'Unmute' : 'Mute'}
                tabIndex={0}
                onClick={toggleMute}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleMute();
                  }
                }}
                style={{
                  position: 'absolute',
                  right: 6,
                  bottom: 6,
                  width: 25,
                  height: 25,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Image
                  src={muted ? '/icons/icons8-mute-50.png' : '/icons/icons8-audio-50.png'}
                  alt={muted ? 'Muted' : 'Unmuted'}
                  width={20}
                  height={20}
                />
              </div>
            )}
          </div>

          <div
            className="mt-2 text-xs text-center"
            style={{ maxWidth: 320, lineHeight: 1.3 }}
          >
            <strong>{art.title}</strong>
            <span> — </span>

            <span className="inline-flex items-center gap-1 align-middle">
              {art.pfp && (
                <Image
                  src={art.pfp}
                  alt={art.artist}
                  loading="lazy"
                  decoding="async"
                  className="rounded-full object-cover border border-black/10 inline-block relative -top-[1.5px]"
                  style={{ verticalAlign: 'middle' }}
                  width={24}
                  height={24}
                />
              )}

              {art.twitter ? (
                <a
                  href={`https://x.com/${art.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  title={`View on X`}
                >
                  {art.artist}
                </a>
              ) : (
                <span>{art.artist}</span>
              )}
            </span>
          </div>

        </div>
      )}


      <div className="flex items-center justify-center gap-8">
        {/* Minus button */}
        <div className="flex flex-row gap-2">
          <Button
            size="sm"
            className='amountButton'
            disabled={amountNum <= 1}
            onClick={() => setAmountStr(String(Math.max(1, amountNum - 1)))}
            style={{ cursor: 'pointer' }}
          >
            −
          </Button>

          <Frame w="68px" h="40px" padding="$4" boxShadow="$in" className="text-center flex flex-col">
            <span className="text-sm">{amountNum}</span>
            <span className='text-[11px] text-gray-700'>{amountOk && price > 0n ? `${prettyWei(totalValue)} ETH` : `${PRICE_SEASON_1} ETH`}</span>
          </Frame>

          {/* Plus button */}
          <Button
            size="sm"
            className='amountButton'
            disabled={
              (maxPerTx !== 0 && amountNum >= maxPerTx) ||
              amountNum >= inventory
            }
            onClick={() => {
              const maxAllowed =
                maxPerTx === 0
                  ? inventory
                  : Math.min(maxPerTx, inventory);
              setAmountStr(String(Math.min(maxAllowed, amountNum + 1)));
            }}
            style={{ cursor: 'pointer' }}
          >
            +
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center mt-3">
        <Button disabled={!canBuy} onClick={handleBuy} className="w-[320px]" style={{ cursor: 'pointer' }}>
          {buyLabel}
        </Button>
      </div>

      {mintSuccess && mintSuccess.id === id && (
        <div className="text-center text-xs">
          <div className="text-green-700 mb-2 mt-2.5">
            <span>Congrats! You minted {mintSuccess.amount} {mintSuccess.amount > 1 ? 'cards' : 'card'}!</span>
          </div>

          <Button
            onClick={handleShareOnX}
            className="inline-flex items-center gap-1.5"
            style={{ cursor: 'pointer' }}
            aria-label="Share on X"
            title="Share on X"
          >
            <span>Share on</span>
            <Image src="/x.webp" alt="X" width={24} height={24} />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ───────────────── Main component ───────────────── */
export default function ArtDrop() {
  const { data: isPaused } = useReadContract({
    address: ART_DROP_ADDR, abi: ART_DROP_ABI, functionName: 'paused',
    enabled: !!ART_DROP_ADDR,
  });

  const [season, setSeason] = useState(0);      // 0 = Season 1
  const [tab, setTab] = useState(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 360 }}>
      <ConnectButton95 />

      <div className="mt-2">
        {/* Seasons */}
        <Tabs value={season} onChange={setSeason} className="mb-3 custom-tabs">
          <Tab title="Season 1" className="mb-2">
            <Tabs value={tab} onChange={setTab} className="mb-2">
              <Tab title="Card 1">
                <CardPanel id={1} isActive={tab === 0} isPaused={!!isPaused} />
              </Tab>


              <Tab title={<Tooltip text="Drops Sept 30th, 5PM EST" delay={200} style={{ cursor: `url(${Cursor.NotAllowed}), not-allowed` }}>Card 2</Tooltip>} disabled />



              <Tab title={<Tooltip text="Drops Oct 7th, 5PM EST" delay={200} style={{ cursor: `url(${Cursor.NotAllowed}), not-allowed` }}>Card 3</Tooltip>} disabled />



              <Tab title={<Tooltip text="Drops Oct 14th, 5PM EST" delay={200} style={{ cursor: `url(${Cursor.NotAllowed}), not-allowed` }}>Card 4</Tooltip>} disabled />



              <Tab title={<Tooltip text="Drops Oct 21th, 5PM EST" delay={200} style={{ cursor: `url(${Cursor.NotAllowed}), not-allowed` }}>Card 5</Tooltip>} disabled />



              <Tab title={<Tooltip text="Drops Nov 4th, 5PM EST" delay={200} style={{ cursor: `url(${Cursor.NotAllowed}), not-allowed` }}>Card 6</Tooltip>} disabled />



              <Tab title={<Tooltip text="Drops Nov 11th" delay={200} style={{ cursor: `url(${Cursor.NotAllowed}), not-allowed` }}>Card 7</Tooltip>} disabled />

            </Tabs>
            <div className="flex flex-row justify-center mt-2 mb-0">
              <span className="mr-1">Contract:</span>
              <a
                href={`https://etherscan.io/address/${ART_DROP_ADDR}`}
                target="_blank"
                rel="noopener noreferrer"
                title={`View on Etherscan`}
              >
                <span>[{ART_DROP_ADDR?.slice(0, 6)}…{ART_DROP_ADDR?.slice(-4)}]</span>
              </a>
            </div>
          </Tab>

          {/* Season 2 placeholder */}
          <Tab title={<Tooltip text="soon!" delay={200} style={{ cursor: `url(${Cursor.NotAllowed}), not-allowed` }}>Season 2</Tooltip>} disabled />
        </Tabs>
      </div>
    </div>
  );
}

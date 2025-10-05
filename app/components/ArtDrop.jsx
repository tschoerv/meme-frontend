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
import { ARTWORKS, PRICE_SEASON_1, DISCOUNT_PCT_SEASON_1, LATEST_CARD } from '../config/artworks';
import { useIsTouchDevice } from '../hooks/useIsTouchDevice';
import { useSuccessModal } from '../contexts/SuccessModalContext';

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
function CardPanel({ id, isActive, isPaused, anchorPos }) {
  const { address: caller, isConnected } = useAccount();
  const [amountStr, setAmountStr] = useState('1');
  const [nowTs, setNowTs] = useState(() => Math.floor(Date.now() / 1000));

  const [pendingMint, setPendingMint] = useState(null); // snapshot before tx

  const { open: openSuccessModal } = useSuccessModal();

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
      setPendingMint(null);
      qc.invalidateQueries({ queryKey: balKey });

      const osUrl = `https://opensea.io/item/ethereum/${MEME_ART_ADDR}/${id}`;
      openSuccessModal(
        {
          amount: pendingMint.amount,
          title: art?.title,
          artist: art?.artist,
          twitter: art?.twitter,
          osUrl,
          xText: `Just minted “${art?.title}” by @${art?.twitter}!\n$MEME Art Drop — Season 1: Discovery 🎨\n@Memecoin2016`,
        },
        { anchor: anchorPos } // ← position the success window based on ArtDrop’s current position
      );
    }
  }, [mined, txHash, pendingMint, id, qc, balKey, art, anchorPos, openSuccessModal]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia('(max-width: 767px)').matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 12.5% smaller on mobile
  const MEDIA_W = isMobile ? art.width * 0.85 : art.width;
  const MEDIA_H = isMobile ? art.height * 0.85 : art.height;

  return (
    <div className="min-w-[320px] md:min-w-[360px]">
      <Fieldset legend={`Mint Status`} className="w-[320px] md:w-[360px] flex flex-col mb-3">
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
        <div className="flex flex-col items-center mb-3 w-[320px] md:w-[360px]">
          <div
            className="overflow-hidden"
            style={{
              position: 'relative',
              width: MEDIA_W,
              height: MEDIA_H,

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
                width={MEDIA_W}
                height={MEDIA_H}
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
                width={MEDIA_W}
                height={MEDIA_H}
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
            className="mt-2 text-xs text-center w-[280px] md:w-[320px]"
            style={{ lineHeight: 1.3 }}
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
        <div className="w-[280px] md:w-[320px]">
          {!isConnected ? (
            <ConnectButton95 />
          ) : (
            <Button
              disabled={!canBuy}
              onClick={handleBuy}
              className="w-full"
              style={{ cursor: 'pointer' }}
            >
              {buyLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Main component ───────────────── */
export default function ArtDrop({ anchorPos, defaultCard = null }) {
  const { data: isPaused } = useReadContract({
    address: ART_DROP_ADDR, abi: ART_DROP_ABI, functionName: 'paused',
    enabled: !!ART_DROP_ADDR,
  });

  const isTouch = useIsTouchDevice();

  const isEnabled = (n) => n <= LATEST_CARD;
  // pick initial card: deep-link wins, but only default to a card
  // if we’re within 12h of its drop (ARTWORKS[n].dropsUnix).
  const now = Math.floor(Date.now() / 1000);
  const WITHIN_12H = (n) => {
    const du = ARTWORKS?.[n]?.dropsUnix;   // unix seconds
    if (!du) return true;                  // no schedule → allow
    return now >= (du - 12 * 3600);
  };
  const desired = defaultCard ?? LATEST_CARD;
  let initialCard;
  if (defaultCard != null && isEnabled(desired)) {
    // Deep-link wins unconditionally (no 12h check)
    initialCard = desired;
  } else {
    // No deep-link → apply 12h rule
    initialCard = isEnabled(desired) ? desired : LATEST_CARD;
    if (!WITHIN_12H(initialCard)) {
      for (let n = initialCard - 1; n >= 1; n--) {
        if (isEnabled(n) && WITHIN_12H(n)) { initialCard = n; break; }
      }
    }
  }
  const initialIndex = initialCard - 1;

  const [season, setSeason] = useState(0);      // 0 = Season 1
  const [tab, setTab] = useState(initialIndex);

  const initialTitle = isEnabled(initialCard) ? `Card ${initialCard}` : `Card ${LATEST_CARD}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 360 }}>
      <ConnectButton95 />

      <div className="mt-2">
        {/* Seasons */}
        <Tabs value={season} onChange={setSeason} className="mb-3 custom-tabs">
          <Tab title="Season 1" className="mb-2">
            <Tabs value={tab} defaultActiveTab={initialTitle} onChange={setTab} className="mb-2">
              <Tab title="Card 1" style={{ cursor: 'pointer' }}>
                <CardPanel id={1} isActive={tab === 0} isPaused={!!isPaused} anchorPos={anchorPos} />
              </Tab>

              <Tab title="Card 2" style={{ cursor: 'pointer' }}>
                <CardPanel id={2} isActive={tab === 1} isPaused={!!isPaused} anchorPos={anchorPos} />
              </Tab>



              <Tab title={<Tooltip text="Drops Oct 14th, 5PM EST" delay={200} style={{ cursor: `url(${Cursor.NotAllowed}), not-allowed` }}>Card 3</Tooltip>} disabled />



              <Tab title={<Tooltip text="Drops Oct 21th, 5PM EST" delay={200} style={{ cursor: `url(${Cursor.NotAllowed}), not-allowed` }}>Card 4</Tooltip>} disabled />



              <Tab title={<Tooltip text="Drops Oct 28th, 5PM EST" delay={200} style={{ cursor: `url(${Cursor.NotAllowed}), not-allowed` }}>Card 5</Tooltip>} disabled />



              <Tab title={<Tooltip text={isTouch ? ("Nov 4th, 5PM EST") : ("Drops Nov 4th, 5PM EST")} delay={200} style={{ cursor: `url(${Cursor.NotAllowed}), not-allowed` }}>Card 6</Tooltip>} disabled />



              <Tab title={<Tooltip text={isTouch ? ("Nov 11th") : ("Drops Nov 11th")} delay={200} style={{ cursor: `url(${Cursor.NotAllowed}), not-allowed` }}>Card 7</Tooltip>} disabled />

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

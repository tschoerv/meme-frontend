'use client';

import { Frame, Tabs, Tab, Cursor } from '@react95/core';
import { Winhlp324000, Brush } from '@react95/icons';
import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ARTWORK_LIST, EDITION_SEASON_1 } from '../config/artworks';
import Image from 'next/image';


const MEME_ART_ADDR = process.env.NEXT_PUBLIC_MEME_ART_ADDRESS;

function ArtworkPreview({ artwork, isActive, onRequestActive, onOpenLightbox }) {
  const isVideo = artwork.src ? /\.mp4(\?.*)?$/i.test(artwork.src) : false;
  const isGif = !!artwork.gif; // mp4 behaving like a gif (no mute control)
  const videoRef = useRef(null);

  const thumb = artwork.thumb || artwork.src;

  // keep inline video mute state in sync with global active (but not for gif-like)
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    if (isGif) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => { });
      return;
    }
    videoRef.current.muted = !isActive;
    if (isActive) {
      videoRef.current.play().catch(() => { });
    }
  }, [isActive, isVideo, isGif]);

  // pause inline video when scrolled off screen (perf)
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    const el = videoRef.current;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !el.paused) el.pause();
        // only auto-resume when muted (autoplay-safe) — gif-like are always muted
        if (entry.isIntersecting && el.paused) {
          el.play().catch(() => { });
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isVideo]);

  const openFullscreen = () => {
    onOpenLightbox(
      isVideo
        ? {
          type: 'video',
          src: artwork.src,
          title: artwork.title,
          artist: artwork.artist,
          poster: artwork.poster,
          gif: artwork.gif, // pass-through for lightbox behavior
        }
        : { type: 'image', src: artwork.src, title: artwork.title, artist: artwork.artist }
    );
  };

  if (!artwork.src) {
    return (
      <div className="flex items-center justify-center bg-[#dcdcdc] h-[300px] min-w-[300px] md:min-w-[350px]">
        <div className="relative w-[48px] h-[48px]">
          <Winhlp324000 variant="32x32_4" className="absolute inset-0 w-full h-full object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#dcdcdc]">
      <div
        className="relative h-[300px] max-w-[300px] md:max-w-[350px] overflow-hidden flex items-center justify-center"
        onClick={openFullscreen}
        role="button"
        title="Open fullscreen"
        aria-label="Open fullscreen"
      >
        {/* Images: show a lightweight thumb in grid */}
        {!isVideo && (
          <img
            src={thumb}
            alt={artwork.title || `Artwork ${artwork.id}`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain"
          />
        )}

        {/* Videos: autoplay + loop inline in grid */}
        {isVideo && (
          <video
            key={artwork.src}
            src={artwork.src}
            ref={videoRef}
            poster={artwork.poster}
            preload="metadata"
            playsInline
            autoPlay
            loop
            muted={isGif ? true : !isActive} // GIF-like: always muted
            controls={false}
            className="w-full h-full object-contain"
          />
        )}

        {/* Mute/unmute button for videos; HIDDEN for gif-like */}
        {isVideo && !isGif && (
          <div
            role="button"
            aria-label={isActive ? 'Mute' : 'Unmute'}
            title={isActive ? 'Mute' : 'Unmute'}
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onRequestActive(isActive ? null : artwork.id);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onRequestActive(isActive ? null : artwork.id);
              }
            }}
            style={{
              position: 'absolute',
              right: 4,
              bottom: 4,
              width: 25,
              height: 25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Image
              src={isActive ? '/icons/icons8-audio-50.png' : '/icons/icons8-mute-50.png'}
              alt={isActive ? 'Unmuted' : 'Muted'}
              width={20}
              height={20}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Lightbox({ item, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [muted, setMuted] = useState(false); // default unmuted for normal videos
  const [needsTap, setNeedsTap] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => setMounted(true), []);

  const isGif = !!item?.gif;

  // Reset state when a new item opens
  useEffect(() => {
    const isGif = !!item?.gif;
    setMuted(isGif ? true : false); // GIF-like start muted & stay muted
    setNeedsTap(false);
  }, [item?.src, item?.gif, isGif]);

  // Esc + body scroll lock
  useEffect(() => {
    if (!item) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [item, onClose]);

  // Keep <video> in sync with mute state and try to autoplay with sound (unless gif-like)
  useEffect(() => {
    if (!item || item.type !== 'video' || !videoRef.current) return;
    const v = videoRef.current;
    v.muted = muted;

    // If it's a gif-like video, we keep it muted and just play.
    const p = v.play();
    if (!isGif && p && typeof p.then === 'function') {
      p.catch(() => {
        // Browser blocked autoplay with sound — show “Tap to play”
        setNeedsTap(true);
      });
    }
  }, [muted, item]);

  const onDownload = (e) => {
    e.stopPropagation();
    if (!item) return;
    const url = item.gif || item.src;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    // try to infer a filename (strip query)
    const clean = url.split('?')[0];
    a.download = clean.substring(clean.lastIndexOf('/') + 1) || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (!item || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[2147483647] bg-black/90"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sized wrapper controls final media size across breakpoints */}
        <div className="relative w-[85vw] h-[80vh] md:w-[65vw] md:h-[65vh]">
          {item.type === 'image' ? (
            <img
              src={item.src}
              alt={item.title || 'Artwork'}
              className="absolute inset-0 w-full h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                src={item.src}
                poster={item.poster}
                playsInline
                autoPlay
                loop
                controls={false}
                muted={muted}
                className="absolute inset-0 w-full h-full object-contain"
              />
              {!isGif && needsTap && (
                <button
                  onClick={() => {
                    setNeedsTap(false);
                    videoRef.current?.play().catch(() => { });
                  }}
                  className="absolute inset-0 m-auto h-12 w-40 rounded bg-white/90 text-black text-sm font-semibold shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/70"
                  style={{ pointerEvents: 'auto' }}
                >
                  Tap to play
                </button>
              )}
            </>
          )}
        </div>

        {/* Mute/Unmute button — left of Close; HIDDEN for gif-like */}
        {item.type === 'video' && !isGif && (
          <button
            aria-label={muted ? 'Unmute' : 'Mute'}
            title={muted ? 'Unmute' : 'Mute'}
            onClick={(e) => { e.stopPropagation(); setMuted(m => !m); }}
            className="absolute top-3 right-[84px]"
            style={{ width: 32, height: 33, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Image
              src={muted ? '/icons/icons8-mute-50.png' : '/icons/icons8-audio-50.png'}
              alt={muted ? 'Muted' : 'Unmuted'}
              width={20}
              height={20}
            />
          </button>
        )}

        <button
          aria-label="Download"
          title="Download"
          onClick={onDownload}
          className="absolute top-3 right-12"
          style={{ width: 32, height: 33, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Image src="/icons/icons8-download-48.png" alt="Download" width={20} height={20} />
        </button>

         {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          title="Close"
          className="absolute top-3 right-3 text-black/90 hover:text-black text-xl cursor-pointer"
          style={{
            width: 32,
            height: 33,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>

      </div>
    </div>,
    document.body
  );
}

export default function ArtGallery() {
  const [season, setSeason] = useState(0);
  const [activeVideoId, setActiveVideoId] = useState(null); // single unmuted inline video
  const [lightboxItem, setLightboxItem] = useState(null); // { type, src, title, artist, poster, gif }

  const sortedArtworks = useMemo(() => {
    return [...ARTWORK_LIST].sort((a, b) => {
      const ia = Number.isFinite(+a.id) ? +a.id : Infinity;
      const ib = Number.isFinite(+b.id) ? +b.id : Infinity;
      return ia - ib; // ascending by id
    });
  }, []);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia('(max-width: 767px)').matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);


  const openLightbox = (item) => {
    setActiveVideoId(null); // ensure inline audio is muted while lightbox is open
    setLightboxItem(item);
  };

  return (
    <div className="mt-1">
      <Tabs value={season} onChange={setSeason} className="mt-3">
        <Tab title="Season 1" className="mb-2">
          <div className="flex min-w-[320px] flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[73.6vh] overflow-y-auto pr-1">
              {sortedArtworks.map((artwork) => {
                const hasMedia = Boolean(artwork.src);
                const hasPfp = Boolean(artwork.pfp);
                const isActive = activeVideoId === artwork.id;

                return (
                  <Frame key={artwork.id} boxShadow="$in" className="flex flex-col gap-2 p-2">
                    <ArtworkPreview
                      artwork={artwork}
                      isActive={isActive}
                      onRequestActive={setActiveVideoId}
                      onOpenLightbox={openLightbox}
                    />

                    <div className="flex flex-col gap-1 text-xs">
                      {hasMedia && (
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold leading-tight">{artwork.title}</span>
                          <span className="text-xs leading-tight text-gray-700 italic mt-0.5">
                            Card {artwork.id}, {EDITION_SEASON_1}
                          </span>
                        </div>
                      )}

                      {!hasMedia && (
                        <span className="text-xs leading-tight text-gray-700 italic">
                          Drops {artwork.drops}, 5PM EST
                        </span>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {hasPfp ? (
                            <Image
                              src={artwork.pfp}
                              alt={artwork.artist}
                              loading="lazy"
                              decoding="async"
                              className="rounded-full object-cover border border-black/10"
                              width={24}
                              height={24}
                            />
                          ) : (
                            <div className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-[#dcdcdc] border border-black/10" />
                          )}
                          <a
                            href={`https://x.com/${artwork.twitter}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0000ee] hover:underline leading-tight truncate"
                            aria-label="View on X"
                            title="View on X"
                          >
                            {artwork.artist}
                          </a>
                        </div>

                        {hasMedia && (
                          <div className='shrink-0 flex items-center gap-2'>
                            {artwork.soldOut === 'false' && (
                              <div
                                type="button"
                                onClick={() => {
                                  const anchor = isMobile ? { x: 20, y: 20 } : { x: 110, y: 20 };
                                  window.__openArtDrop?.({ card: artwork.id, anchor });
                                }}
                                aria-label={`Open ArtDrop for card ${artwork.id}`}
                                title="Open ArtDrop"
                                className="inline-flex items-center justify-center leading-none"
                              >
                                <Brush
                                  variant="32x32_4"
                                  // these hit the underlying <img>, overriding intrinsic size
                                  width={22}
                                  height={22}
                                  style={{ width: 22, height: 22 }}
                                />
                              </div>
                            )}
                            <a
                              href={`https://opensea.io/item/ethereum/${MEME_ART_ADDR}/${artwork.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0"
                              aria-label="View on OpenSea"
                              title="View on OpenSea"
                            >
                              <Image src="/icons/os_logo.webp" alt="OpenSea" width={22} height={22} className="block" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </Frame>
                );
              })}
            </div>
          </div>
        </Tab>

        <Tab
          title="Season 2"
          style={{ cursor: `url(${Cursor.NotAllowed}), not-allowed` }}
          disabled
        />
      </Tabs>

      <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
    </div>
  );
}

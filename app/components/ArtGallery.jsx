'use client';

import { Frame, Tabs, Tab, Cursor } from '@react95/core';
import { Winhlp324000 } from '@react95/icons';
import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { ARTWORK_LIST, EDITION_SEASON_1 } from '../config/artworks';

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
          gif: isGif, // pass-through for lightbox behavior
        }
        : { type: 'image', src: artwork.src, title: artwork.title, artist: artwork.artist }
    );
  };

  if (!artwork.src) {
    return (
      <div className="flex items-center justify-center bg-[#dcdcdc] h-[200px] md:h-[250px]">
        <div className="relative w-[48px] h-[48px]">
          <Winhlp324000 variant="32x32_4" className="absolute inset-0 w-full h-full object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#dcdcdc]">
      <div
        className="relative h-[200px] md:h-[250px] overflow-hidden flex items-center justify-center"
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
            <img
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

  // Reset state when a new item opens
  useEffect(() => {
    const isGif = !!item?.gif;
    setMuted(isGif ? true : false); // GIF-like start muted & stay muted
    setNeedsTap(false);
  }, [item?.src, item?.gif]);

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
    if (!item.gif && p && typeof p.then === 'function') {
      p.catch(() => {
        // Browser blocked autoplay with sound — show “Tap to play”
        setNeedsTap(true);
      });
    }
  }, [muted, item]);

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
              {!item.gif && needsTap && (
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

        {/* Mute/Unmute button — left of Close; HIDDEN for gif-like */}
        {item.type === 'video' && !item.gif && (
          <button
            role="button"
            aria-label={muted ? 'Unmute' : 'Mute'}
            title={muted ? 'Unmute' : 'Mute'}
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setMuted((m) => !m);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                setMuted((m) => !m);
              }
            }}
            style={{
              width: 32,
              height: 33,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            className="absolute top-3 right-12"
          >
            <img
              src={muted ? '/icons/icons8-mute-50.png' : '/icons/icons8-audio-50.png'}
              alt={muted ? 'Muted' : 'Unmuted'}
              width={20}
              height={20}
            />
          </button>
        )}
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
    const byArtist = (a, b) =>
      (a.artist || '').localeCompare(b.artist || '', undefined, { sensitivity: 'base' });

    const withSrc = [];
    const withoutSrc = [];

    for (const a of ARTWORK_LIST) {
      (a.src ? withSrc : withoutSrc).push(a);
    }

    withSrc.sort((a, b) => {
      const ca = Number.isFinite(+a.card) ? +a.card : Infinity;
      const cb = Number.isFinite(+b.card) ? +b.card : Infinity;
      if (ca !== cb) return ca - cb;       // by card number
      return byArtist(a, b);               // tie-break by artist
    });

    withoutSrc.sort(byArtist);             // pure alpha by artist

    return [...withSrc, ...withoutSrc];
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
                const hasOs = Boolean(artwork.os);
                const hasPfp = Boolean(artwork.pfp);
                const hasCard = Boolean(artwork.card);
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
                        <span className="font-semibold leading-tight">{artwork.title}</span>
                      )}

                      {hasCard && (
                        <span className="text-xs leading-tight text-gray-700 italic mt-0.5">
                          Card {artwork.card}, {EDITION_SEASON_1}
                        </span>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {hasPfp ? (
                            <img
                              src={artwork.pfp}
                              alt={`${artwork.artist} avatar`}
                              loading="lazy"
                              decoding="async"
                              className="h-5 w-5 md:h-6 md:w-6 rounded-full object-cover border border-black/10"
                            />
                          ) : (
                            <div className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-[#dcdcdc] border border-black/10" />
                          )}
                          <a
                            href={artwork.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0000ee] hover:underline leading-tight truncate"
                            aria-label="View on X"
                            title="View on X"
                          >
                            {artwork.artist}
                          </a>
                        </div>

                        {hasOs && (
                          <a
                            href={artwork.os}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                            aria-label="View on OpenSea"
                            title="View on OpenSea"
                          >
                            <img src="/icons/os_logo.webp" alt="OpenSea" className="h-5 w-5" />
                          </a>
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

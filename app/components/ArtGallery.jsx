'use client';

import { Frame } from '@react95/core';
import { Winhlp324000 } from '@react95/icons';
import Image from 'next/image';

import { ARTWORK_LIST } from '../config/artworks';

function ArtworkPreview({ artwork }) {
  const isVideo = artwork.src ? /\.mp4(\?.*)?$/i.test(artwork.src) : false;

  if (!artwork.src) {
    return (
      <div className="flex h-[160px] items-center justify-center bg-[#dcdcdc]">
        <Winhlp324000 variant="32x32_4" />
      </div>
    );
  }

  return (
    <div className="relative h-[160px] overflow-hidden bg-[#dcdcdc]">
      {isVideo ? (
        <video
          src={artwork.src}
          muted
          loop
          playsInline
          autoPlay
          className="h-full w-full object-cover"
        />
      ) : (
        <Image
          src={artwork.src}
          alt={artwork.title || `Artwork ${artwork.id}`}
          fill
          sizes="100%"
          className="object-cover"
        />
      )}
    </div>
  );
}

export default function ArtGallery() {
  return (
    <div className="flex min-w-[420px] flex-col gap-4">
      <p className="text-sm text-center">Season 1 Gallery</p>
      <div className="grid max-h-[60vh] grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 overflow-y-auto pr-1">
        {ARTWORK_LIST.map((artwork) => {
          const hasMedia = Boolean(artwork.src);

          return (
            <Frame key={artwork.id} boxShadow="$in" className="flex flex-col gap-2 p-2">
              <ArtworkPreview artwork={artwork} />
              <div className="flex flex-col gap-1 text-xs">
                {hasMedia && (
                  <span className="font-semibold leading-tight">
                    {artwork.title || `Card ${artwork.id}`}
                  </span>
                )}
                <span className="leading-tight text-gray-700">{artwork.artist}</span>
                {hasMedia && artwork.twitter && (
                  <a
                    href={artwork.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0000ee] hover:underline"
                  >
                    View artist on X
                  </a>
                )}
              </div>
            </Frame>
          );
        })}
      </div>
    </div>
  );
}
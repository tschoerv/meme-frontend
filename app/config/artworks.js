export const ARTWORKS = {
  1: { src: '/art/season1/artonymousartifakt_ART.mp4', artist: 'artonymousartifakt', title: 'artonymousartifakt', twitter: 'https://x.com/artonymousart' },
  2: { src: '', artist: 'Bitcoin', title: '', twitter: 'https://x.com/artistbitcoin' },
  3: { src: '', artist: 'CryptoArte', title: '', twitter: 'https://x.com/CryptoArte' },
  4: { src: '', artist: 'DeltaSauce', title: '', twitter: 'https://x.com/delta_sauce' },
  5: { src: '', artist: 'Metageist', title: '', twitter: 'https://x.com/MetageistVR' },
  6: { src: '', artist: 'Nuclear Samurai', title: '', twitter: 'https://x.com/MutagenSamurai' },
  7: { src: '', artist: 'VERDANDI', title: '', twitter: 'https://x.com/TheVERDANDI' },
};

export const PRICE_SEASON_1= 0.01

export const EDITION_SEASON_1 = "1/100"

export const ARTWORK_LIST = Object.entries(ARTWORKS).map(([id, details]) => ({
  id: Number(id),
  ...details,
}));
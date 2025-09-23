export const ARTWORKS = {
  1: { src: '/art/season1/artonymousartifakt_The_DAO.mp4', poster: '/art/season1/optimized/artonymousartifakt_The_DAO-poster-320w.webp', artist: 'artonymousartifakt', title: 'The DAO', pfp:'/artist_pfp/ARTONYMOUSART.webp', twitter: 'artonymousart' },
  2: { src: '', thumb:'', artist: 'Nuclear Samurai', title: '', pfp:'/artist_pfp/NUCLEARSAMURAI.webp', twitter: 'MutagenSamurai' },
  3: { src: '', thumb:'', artist: 'CryptoArte', title: '', pfp:'/artist_pfp/CRYPTOARTE.webp', twitter: 'CryptoArte' },
  4: { src: '', thumb:'', artist: 'DeltaSauce', title: '', pfp:'/artist_pfp/DELTASAUCE.webp', twitter: 'delta_sauce' },
  5: { src: '', thumb:'', artist: 'Metageist', title: '', pfp:'/artist_pfp/METAGEIST.webp', twitter: 'MetageistVR' },
  6: { src: '', thumb:'', artist: 'Bitcoin', title: '', pfp:'/artist_pfp/ARTISTBITCOIN.webp', twitter: 'artistbitcoin' },
  7: { src: '', thumb:'', artist: 'VERDANDI', title: '', pfp:'/artist_pfp/VERDANDI.webp', twitter: 'TheVERDANDI' },
};

export const PRICE_SEASON_1= 0.01

export const DISCOUNT_PCT_SEASON_1 = 10; //10%

export const EDITION_SEASON_1 = "1/100"

export const ARTWORK_LIST = Object.entries(ARTWORKS).map(([id, details]) => ({
  id: Number(id),
  ...details,
}));
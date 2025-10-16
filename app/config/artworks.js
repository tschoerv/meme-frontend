export const ARTWORKS = {
  1: { src: '/art/season1/artonymousartifakt_The_DAO.mp4', poster: '/art/season1/optimized/artonymousartifakt_The_DAO-poster-320w.webp', artist: 'artonymousartifakt', title: 'The DAO', pfp:'/artist_pfp/ARTONYMOUSART.webp', twitter: 'artonymousart', drops: 'Sept 30th', dropsUnix: '1759266000', width:'320', height: '213', soldOut: 'false' },
  2: { src: '/art/season1/NuclearSamurai_Take_Me_Back.png', thumb:'/art/season1/optimized/NuclearSamurai_Take_Me_Back-320w.webp', artist: 'Nuclear Samurai', title: 'Take Me Back', pfp:'/artist_pfp/NUCLEARSAMURAI.webp', twitter: 'MutagenSamurai', drops: 'Oct 7th', dropsUnix: '1759870800', width:'168', height: '252', soldOut: 'false' },
  3: { src: '/art/season1/CryptoArte_I-algo.png', thumb:'/art/season1/optimized/CryptoArte_I-algo-320w.webp', artist: 'CryptoArte', title: 'I-algo', pfp:'/artist_pfp/CRYPTOARTE.webp', twitter: 'CryptoArte', drops: 'Oct 14th', dropsUnix: '1760475600', width:'252', height: '252', soldOut: 'true' },
  4: { src: '', thumb:'', artist: 'DeltaSauce', title: '', pfp:'/artist_pfp/DELTASAUCE.webp', twitter: 'delta_sauce', drops: 'Oct 21th', dropsUnix: '1761080400', width:'', height: '', soldOut: 'false' },
  5: { src: '', thumb:'', artist: 'Metageist', title: '', pfp:'/artist_pfp/METAGEIST.webp', twitter: 'MetageistVR', drops: 'Oct 28th', dropsUnix: '1761685200', width:'', height: '', soldOut: 'false' },
  6: { src: '', thumb:'', artist: 'Bitcoin', title: '', pfp:'/artist_pfp/ARTISTBITCOIN.webp', twitter: 'artistbitcoin', drops: 'Nov 4th', dropsUnix: '1762293600', width:'', height: '', soldOut: 'false' },
  7: { src: '', thumb:'', artist: 'VERDANDI', title: '', pfp:'/artist_pfp/VERDANDI.webp', twitter: 'TheVERDANDI', drops: 'Nov 11th', dropsUnix: '1762898400', width:'', height: '', soldOut: 'false' },
};

export const LATEST_CARD = 3;

export const PRICE_SEASON_1 = 0.01;

export const DISCOUNT_PCT_SEASON_1 = 10; //10%

export const EDITION_SEASON_1 = '1/100';

export const ARTWORK_LIST = Object.entries(ARTWORKS).map(([id, details]) => ({
  id: Number(id),
  ...details,
}));
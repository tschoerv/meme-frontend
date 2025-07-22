import localFont from 'next/font/local';
import { Providers } from "./providers.js";
import "@rainbow-me/rainbowkit/styles.css";
import './globals.css';

import '@react95/core/GlobalStyle';
import '@react95/core/themes/win95.css';
import '@react95/core/Cursor'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata = {
  title: "MEME",
  description: "First Meme on ETH",
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: "MEME",
    description: "First Meme on ETH",
    url: "https://meme2016.eth.limo",
    type: "website",
    images: [
      {
        url: "https://meme2016.eth.limo/meme_banner.JPG", // must be an absolute URL
        width: 1200,
        height: 630,
        alt: "MEME",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MEME",
    description: "First Meme on ETH",
    images: ["https://meme2016.eth.limo/meme_banner.JPG"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

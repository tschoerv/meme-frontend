'use client';
import { createContext, useContext, useState } from 'react';

const DesktopContext = createContext();

export function DesktopProvider({ children }) {
  const [desktopItems, setDesktopItems] = useState({
    logo: true,
    telegram: true,
    x: true,
    dexscreener: true,
    github: true,
  });

  const removeItem = (key) => {
    setDesktopItems((items) => ({ ...items, [key]: false }));
  };

  return (
    <DesktopContext.Provider value={{ desktopItems, removeItem }}>
      {children}
    </DesktopContext.Provider>
  );
}

export const useDesktop = () => useContext(DesktopContext);

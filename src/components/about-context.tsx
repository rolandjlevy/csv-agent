'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AboutOverlay } from '@/components/about-overlay';

type AboutContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const AboutContext = createContext<AboutContextValue | null>(null);

export function AboutProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [isOpen]
  );

  return (
    <AboutContext.Provider value={value}>
      {children}
      <AnimatePresence>{isOpen && <AboutOverlay />}</AnimatePresence>
    </AboutContext.Provider>
  );
}

export function useAbout() {
  const context = useContext(AboutContext);
  if (!context) {
    throw new Error('useAbout must be used within an AboutProvider');
  }
  return context;
}

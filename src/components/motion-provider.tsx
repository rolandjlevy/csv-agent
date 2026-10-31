'use client';

import { MotionConfig } from 'framer-motion';

// Makes every Framer Motion animation honour the visitor's "reduce motion"
// setting (movement is dropped; opacity fades are kept).
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

'use client';

import React, { ReactNode } from 'react';
// import { SessionProvider } from 'next-auth/react';

export const NextAuthProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
}; 
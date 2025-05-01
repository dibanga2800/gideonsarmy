'use client';

import React, { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

export function BootstrapProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load Bootstrap JavaScript on the client side
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return <>{children}</>;
} 
import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from 'sonner';
import Script from 'next/script';
import AuthSessionProvider from "@/components/AuthSessionProvider";
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Gideon's Army",
  description: "Gideon's Army Dues Management",
  icons: {
    icon: {
      url: '/favicon.ico',
      sizes: 'any',
    }
  },
};

const externalStyles = [
  {
    rel: 'stylesheet',
    href: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
    integrity: 'sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN',
    crossOrigin: 'anonymous' as const,
  },
  {
    rel: 'stylesheet',
    href: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
    crossOrigin: 'anonymous' as const,
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {externalStyles.map((style, index) => (
          <link key={index} {...style} />
        ))}
      </head>
      <body suppressHydrationWarning className={inter.className}>
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
        <Toaster position="top-right" richColors />
        
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"
          integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
} 
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ARSU — Академическая мобильность",
  description: "Университет им. К. Жубанова — платформа академической мобильности",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'white',
              color: '#1e293b',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
              padding: '14px 18px',
              maxWidth: '380px',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: 'white' },
              style: {
                background: 'white',
                borderLeft: '4px solid #22c55e',
              },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: 'white' },
              style: {
                background: 'white',
                borderLeft: '4px solid #ef4444',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
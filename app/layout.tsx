import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "ARSU — Академическая мобильность",
  description:
    "Университет им. К. Жубанова — платформа академической мобильности: подача заявок, отслеживание статусов, ИИ-ассистент",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--card)",
              color: "var(--foreground)",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              fontSize: "14px",
              padding: "14px 18px",
              maxWidth: "380px",
              border: "1px solid var(--border)",
            },
            success: { iconTheme: { primary: "#22c55e", secondary: "white" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "white" } },
          }}
        />
      </body>
    </html>
  );
}
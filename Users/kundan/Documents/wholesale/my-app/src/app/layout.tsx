
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Kundan Mart",
  description: "Your one-stop shop for everything.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)} suppressHydrationWarning={true}>
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100vw',
          height: '100vh',
          backgroundColor: 'yellow',
          color: 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          fontWeight: 'bold',
          zIndex: 9999,
          padding: '2rem',
          textAlign: 'center'
        }}>
          If you see this, src/app/layout.tsx is the correct file.
        </div>
      </body>
    </html>
  );
}

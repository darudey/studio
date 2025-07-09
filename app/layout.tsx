import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/app/Header";
import { cn } from "@/lib/utils";
import { CategorySettingsProvider } from "@/context/CategorySettingsContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Wholesale Hub",
  description: "Your one-stop shop for everything.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <CategorySettingsProvider>
            <CartProvider>
              <div className="relative flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
              </div>
              <Toaster />
            </CartProvider>
          </CategorySettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

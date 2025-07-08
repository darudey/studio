
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/app/Header";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Kundan Mart",
  description: "Your one-stop shop for everything.",
};

const HeaderSkeleton = () => (
  <header className="sticky top-0 z-40 w-full bg-[hsl(var(--header-background))]">
    <div className="container flex h-16 items-center justify-between gap-2 px-2 sm:px-4 md:px-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-[50px] rounded-lg" />
      </div>
      <div className="relative flex-1 max-w-md">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      <div className="flex shrink-0 items-center justify-end space-x-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  </header>
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <AuthProvider>
          <CartProvider>
            <div className="relative flex min-h-screen flex-col">
              <Suspense fallback={<HeaderSkeleton />}>
                <Header />
              </Suspense>
              <main className="flex-1">{children}</main>
            </div>
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

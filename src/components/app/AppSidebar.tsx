
'use client';
import Link from 'next/link';
import { Flame, Star, Zap, LayoutGrid, Package2 } from "lucide-react";
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';

const menuItems = [
    { href: "/?view=all", view: "all", label: "All Products", icon: LayoutGrid },
    { href: "/?view=trending", view: "trending", label: "Trending Now", icon: Flame },
    { href: "/?view=recommended", view: "recommended", label: "Recommended", icon: Star },
    { href: "/?view=new", view: "new", label: "New Arrivals", icon: Zap },
];

const AppSidebarContent = () => {
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view') || 'all';

    return (
        <div className="flex h-full flex-col gap-2">
            <div className="flex h-16 items-center border-b px-4">
                 <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Package2 className="h-6 w-6 text-primary" />
                    <span className="">Wholesale Hub</span>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-2">
                <nav className="grid items-start px-4 text-sm font-medium">
                    {menuItems.map(item => (
                        <Link
                            key={item.view}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                currentView === item.view && "bg-muted text-primary"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    );
}

export default function AppSidebar() {
    return (
        <React.Suspense fallback={<div className="p-4">Loading...</div>}>
            <AppSidebarContent />
        </React.Suspense>
    )
}


"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { LogOut, ReceiptText, User as UserIcon, Users, PlusCircle, ClipboardList, Ticket } from "lucide-react";

export default function UserNav() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getInitials = (name: string) => {
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/profile">
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/orders">
            <DropdownMenuItem>
              <ReceiptText className="mr-2 h-4 w-4" />
              <span>Order History</span>
            </DropdownMenuItem>
          </Link>
          {user.role === 'basic' && (
            <Link href="/redeem">
              <DropdownMenuItem>
                <Ticket className="mr-2 h-4 w-4" />
                <span>Redeem Coupon</span>
              </DropdownMenuItem>
            </Link>
          )}
        </DropdownMenuGroup>

        {user.role === 'shop-owner' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Shop Owner</DropdownMenuLabel>
            <DropdownMenuGroup>
               <Link href="/shop-owner/orders">
                <DropdownMenuItem>
                  <ReceiptText className="mr-2 h-4 w-4" />
                  <span>All Orders</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/developer/products">
                <DropdownMenuItem>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  <span>Manage Products</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/developer/add-item">
                <DropdownMenuItem>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>Add Product</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
          </>
        )}
        
        {user.role === 'developer' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Developer</DropdownMenuLabel>
            <DropdownMenuGroup>
               <Link href="/developer/users">
                <DropdownMenuItem>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Manage Users</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/developer/coupons">
                <DropdownMenuItem>
                  <Ticket className="mr-2 h-4 w-4" />
                  <span>Manage Coupons</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/developer/products">
                <DropdownMenuItem>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  <span>Manage Products</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/developer/add-item">
                <DropdownMenuItem>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>Add Product</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/shop-owner/orders">
                <DropdownMenuItem>
                  <ReceiptText className="mr-2 h-4 w-4" />
                  <span>All Orders</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

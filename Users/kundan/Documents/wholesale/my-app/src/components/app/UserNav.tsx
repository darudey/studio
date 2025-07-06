
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
import { useRouter } from "next/navigation";
import { LogOut, ReceiptText, User as UserIcon, Users, PlusCircle, ClipboardList, Ticket, Image as ImageIcon, Bell } from "lucide-react";
import { Badge } from "../ui/badge";

export default function UserNav({ newOrdersCount }: { newOrdersCount?: number }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const getInitials = (name: string) => {
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.toUpperCase();
  };

  const hasAdminMenu = ['developer', 'shop-owner', 'imager'].includes(user.role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
           {newOrdersCount > 0 && (
             <Badge variant="destructive" className="absolute top-0 right-0 h-4 w-4 justify-center rounded-full p-0 text-[10px]">{newOrdersCount > 9 ? '9+' : newOrdersCount}</Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <Badge variant={user.role === 'developer' || user.role === 'shop-owner' || user.role === 'imager' ? 'destructive' : user.role === 'wholesaler' ? 'default' : 'secondary'} className="capitalize text-xs">
                {user.role}
              </Badge>
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <Link href="/profile" onMouseEnter={() => router.prefetch('/profile')}>
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4 text-blue-600" />
              <span>Profile</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/orders" onMouseEnter={() => router.prefetch('/orders')}>
            <DropdownMenuItem>
              <ReceiptText className="mr-2 h-4 w-4 text-blue-600" />
              <span>Order History</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/notifications" onMouseEnter={() => router.prefetch('/notifications')}>
            <DropdownMenuItem>
              <Bell className="mr-2 h-4 w-4 text-blue-600" />
              <span>Notifications</span>
              {newOrdersCount > 0 && <Badge variant="destructive" className="ml-auto">{newOrdersCount > 9 ? '9+' : newOrdersCount}</Badge>}
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>

        {user.role === 'basic' && (
           <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <Link href="/redeem" onMouseEnter={() => router.prefetch('/redeem')}>
                <DropdownMenuItem>
                    <Ticket className="mr-2 h-4 w-4 text-blue-600" />
                    <span>Redeem Coupon</span>
                </DropdownMenuItem>
                </Link>
            </DropdownMenuGroup>
           </>
        )}

        {hasAdminMenu && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Admin Tools</DropdownMenuLabel>
            <DropdownMenuGroup>
              {['developer', 'shop-owner'].includes(user.role) && (
                <Link href="/shop-owner/orders" onMouseEnter={() => router.prefetch('/shop-owner/orders')}>
                  <DropdownMenuItem>
                    <Users className="mr-2 h-4 w-4 text-blue-600" />
                    <span>Manage Orders</span>
                  </DropdownMenuItem>
                </Link>
              )}
              {user.role === 'developer' && (
                <Link href="/developer/users" onMouseEnter={() => router.prefetch('/developer/users')}>
                  <DropdownMenuItem>
                    <Users className="mr-2 h-4 w-4 text-blue-600" />
                    <span>Manage Users</span>
                  </DropdownMenuItem>
                </Link>
              )}
              {user.role === 'developer' && (
                <Link href="/developer/coupons" onMouseEnter={() => router.prefetch('/developer/coupons')}>
                  <DropdownMenuItem>
                    <Ticket className="mr-2 h-4 w-4 text-blue-600" />
                    <span>Manage Coupons</span>
                  </DropdownMenuItem>
                </Link>
              )}
              <Link href="/developer/image-lab" onMouseEnter={() => router.prefetch('/developer/image-lab')}>
                <DropdownMenuItem>
                  <ImageIcon className="mr-2 h-4 w-4 text-blue-600" />
                  <span>Image Lab</span>
                </DropdownMenuItem>
              </Link>
              {['developer', 'shop-owner'].includes(user.role) && (
                <Link href="/developer/products" onMouseEnter={() => router.prefetch('/developer/products')}>
                  <DropdownMenuItem>
                    <ClipboardList className="mr-2 h-4 w-4 text-blue-600" />
                    <span>Manage Products</span>
                  </DropdownMenuItem>
                </Link>
              )}
              {['developer', 'shop-owner'].includes(user.role) && (
                <Link href="/developer/add-item" onMouseEnter={() => router.prefetch('/developer/add-item')}>
                  <DropdownMenuItem>
                    <PlusCircle className="mr-2 h-4 w-4 text-blue-600" />
                    <span>Add Product</span>
                  </DropdownMenuItem>
                </Link>
              )}
            </DropdownMenuGroup>
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4 text-blue-600" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

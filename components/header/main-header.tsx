"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLogoutMutation, useRetrieveUserQuery } from '@/redux/features/authApiSlice';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, ChartBar, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from '@/hooks/use-toast';

export default function MainHeader() {
  const router = useRouter();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const {
    data: user,
    isLoading,
    error
  } = useRetrieveUserQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (error) {
      console.error('Failed to fetch user profile:', error);
    }
  }, [error]);

  const handleLogout = async () => {
    try {
      await logout({}).unwrap();
      router.push('/auth/login');
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error) {
      console.error('Failed to logout', error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging you out",
        variant: "destructive"
      });
    }
  };

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Add a space for the sidebar toggle button on mobile */}
          <div className="w-8 h-8 md:hidden"></div>

          <Link href="/dashboard" className="flex items-center space-x-3">
            <Image
              src="/images/University_of_Cyprus.svg"
              width={50}
              height={50}
              alt="University of Cyprus Logo"
              className="h-10 w-auto"
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight">KOE Insights Lab</span>
              <span className="text-xs text-muted-foreground">Database for CypERC</span>
            </div>
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-6">
          <Link
            href="/dashboard/indicators"
            className="text-sm font-medium hover:text-secondary transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <ChartBar className="h-4 w-4" />
              <span>Data</span>
            </div>
          </Link>
          <Link
            href="/dashboard/workflows"
            className="text-sm font-medium hover:text-secondary transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Workflow className="h-4 w-4" />
              <span>Workflows</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-secondary border-t-transparent"></div>
                  </div>
                ) : (
                  <Avatar className="h-10 w-10 border border-secondary/20">
                    <AvatarImage
                      src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'user'}`}
                      alt={user?.email || 'User avatar'}
                    />
                    <AvatarFallback className="bg-secondary/10 text-secondary">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  {isLoading ? (
                    <>
                      <div className="h-4 w-28 bg-muted animate-pulse rounded"></div>
                      <div className="h-3 w-40 bg-muted animate-pulse rounded"></div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium leading-none">
                        {user ? `${user.first_name} ${user.last_name}` : 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email || 'Loading...'}
                      </p>
                    </>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push('/dashboard')}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4 text-tertiary" />
                <span>Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                {isLoggingOut ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent"></div>
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

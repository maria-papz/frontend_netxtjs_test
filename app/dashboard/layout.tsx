"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconUsers,
  IconTable,
  IconChartBar,
  IconLogout,
  IconLayoutDashboard,
} from "@tabler/icons-react";
import { useLogoutMutation } from "@/redux/features/authApiSlice";
import { logout as setLogout } from '@/redux/features/authSlice';
import { useAppDispatch } from "@/redux/hooks";
import RequireAuth from "@/components/utils/RequireAuth";
import { toast } from "@/hooks/use-toast";
import MainHeader from "@/components/header/main-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeProvider } from "@/components/theme-provider";
import { IconWorkflow } from "@/components/icons/workflow-icon";
import { AnimatedBlob } from "@/components/ui/animated-blob";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [logout] = useLogoutMutation();
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Enhanced window resize handler for better responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setOpen(false);
        if (window.innerWidth < 768) {
          setIsMobile(true);
        } else {
          setIsMobile(false);
        }
      } else {
        setOpen(true);
        setIsMobile(false);
      }
    };

    // Initialize on mount
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await logout({}).unwrap();
      dispatch(setLogout());
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

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <IconLayoutDashboard className="h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Users",
      href: "/dashboard/users",
      icon: <IconUsers className="h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Tables",
      href: "/dashboard/tables",
      icon: <IconTable className="h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Indicators",
      href: "/dashboard/indicators",
      icon: <IconChartBar className="h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Workflows",
      href: "/dashboard/workflows",
      icon: <IconWorkflow className="h-5 w-5 flex-shrink-0" />,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <RequireAuth>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen flex flex-col">
          {/* Move the blob here to be properly positioned in DOM order */}
          <div className="absolute inset-0 overflow-hidden z-0">
            <AnimatedBlob />
          </div>

          <MainHeader />

          <div className="flex flex-1 relative z-10">
            <Sidebar open={open} setOpen={setOpen} animate={!isMobile}>
              <SidebarBody className="justify-between h-full">
                <div className="flex flex-col gap-1 mt-2">
                  {links.map((link, idx) => (
                    <SidebarLink
                      key={idx}
                      link={link}
                      active={isActive(link.href)}
                    />
                  ))}

                  <div className="h-px bg-border my-3" />

                  {/* Theme Toggle - only visible when sidebar is expanded */}
                  {open && (
                    <div className="flex items-center justify-center px-3 py-2">
                      <ThemeToggle />
                    </div>
                  )}

                  <div className="h-px bg-border my-3" />

                  <SidebarLink
                    link={{
                      label: "Logout",
                      href: "#",
                      icon: <IconLogout className="h-5 w-5 flex-shrink-0" />,
                      onClick: handleLogout
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  />
                </div>
              </SidebarBody>
            </Sidebar>

            <main
              className={`flex-1 overflow-y-auto min-h-[calc(100vh-64px)] relative transition-all duration-300 backdrop-blur-[2px] ${
                isMobile ? 'ml-0' : (open ? 'ml-[260px]' : 'ml-[70px]')
              }`}
            >
              {/* Overlay with transparency for content background */}
              <div className="absolute inset-0 bg-secondary/5 dark:bg-zinc-900/70 z-0"></div>

              {/* Content wrapper with proper z-index */}
              <div className="relative z-10">
                {children}
              </div>
            </main>
          </div>
        </div>
      </ThemeProvider>
    </RequireAuth>
  );
}

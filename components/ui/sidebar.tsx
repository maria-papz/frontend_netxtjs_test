"use client";
import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import React, { useState, createContext, useContext, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconMenu2, IconX } from "@tabler/icons-react";

interface Links {
  onClick?: () => void;
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = ({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  [key: string]: unknown;
}) => {
  const { isMobile } = useSidebar();
  return (
    <>
      {isMobile ? (
        <MobileSidebar className={className}>
          {children as React.ReactNode}
        </MobileSidebar>
      ) : (
        <DesktopSidebar className={className} {...props}>
          {children as React.ReactNode}
        </DesktopSidebar>
      )}
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "h-[calc(100vh-64px)] px-4 py-4 hidden md:flex md:flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r shadow-sm fixed top-16 left-0 z-30 overflow-y-auto",
          className
        )}
        animate={{
          width: animate ? (open ? "260px" : "70px") : "260px",
        }}
        transition={{ duration: 0.2 }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  const { open, setOpen } = useSidebar();

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (open && !target.closest(".mobile-sidebar-container")) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);

  return (
    <>
      {/* Repositioned button to the header area */}
      <div className={cn("fixed top-4 left-2 z-50 md:hidden")}>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-full bg-background/90 shadow-md border hover:bg-muted/80 transition-colors"
          aria-label="Toggle sidebar menu"
        >
          <IconMenu2 className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={cn(
              "fixed top-16 left-0 h-[calc(100vh-64px)] w-[270px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border-r shadow-lg z-50 md:hidden overflow-y-auto mobile-sidebar-container",
              className
            )}
          >
            <div className="h-full">
              <div className="absolute right-3 top-3">
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <IconX className="h-4 w-4" />
                </button>
              </div>
              <div className="pt-10 px-4">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  active,
  ...props
}: {
  link: Links;
  className?: string;
  active?: boolean;
  props?: LinkProps;
}) => {
  const { open, animate, isMobile } = useSidebar();

  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-3 rounded-md px-3 py-2.5 transition-colors",
        "hover:bg-secondary/10 hover:text-secondary",
        active && "bg-secondary/10 text-secondary font-medium",
        className
      )}
      onClick={(e) => {
        if (link.onClick) {
          e.preventDefault();
          link.onClick();
        }
      }}
      {...props}
    >
      {link.icon}

      <motion.span
        animate={{
          display: isMobile
            ? "inline-block"
            : animate
            ? open
              ? "inline-block"
              : "none"
            : "inline-block",
          opacity: isMobile ? 1 : animate ? (open ? 1 : 0) : 1,
        }}
        className="text-sm whitespace-pre inline-block"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  TrendingUp,
  Users,
  Heart,
  Gamepad2,
  Mail,
  Bell,
  Flag,
  Ban,
  Megaphone,
  Settings,
  ShoppingCart,
  Coins,
  Drama,
  Radio,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Shield,
} from "lucide-react";
import { removeToken } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Tailwind color for the icon when the item is active (and as a subtle accent dot when not active) */
  tone: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tone: "text-sky-500" },
      { href: "/analytics", label: "Analytics", icon: TrendingUp, tone: "text-violet-500" },
      { href: "/coins", label: "Coins", icon: Coins, tone: "text-amber-500" },
    ],
  },
  {
    title: "Community",
    items: [
      { href: "/players", label: "Players", icon: Users, tone: "text-emerald-500" },
      { href: "/friends", label: "Friends", icon: Heart, tone: "text-rose-500" },
      { href: "/games", label: "Games", icon: Gamepad2, tone: "text-indigo-500" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/contacts", label: "Contacts", icon: Mail, tone: "text-cyan-500" },
      { href: "/notifications", label: "Notifications", icon: Bell, tone: "text-yellow-500" },
      { href: "/reports", label: "Reports", icon: Flag, tone: "text-orange-500" },
      { href: "/voice-monitor", label: "Voice Monitor", icon: Radio, tone: "text-purple-500" },
      { href: "/bans", label: "Bans", icon: Ban, tone: "text-red-500" },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/ads", label: "Ads", icon: Megaphone, tone: "text-fuchsia-500" },
      { href: "/shop", label: "Shop", icon: ShoppingCart, tone: "text-teal-500" },
      { href: "/roles", label: "Roles", icon: Drama, tone: "text-purple-500" },
      { href: "/settings", label: "Settings", icon: Settings, tone: "text-slate-500" },
    ],
  },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const options: { value: "light" | "dark" | "system"; icon: LucideIcon; label: string }[] = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ];
  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-md border border-border bg-muted/40">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            title={opt.label}
            aria-label={opt.label}
            className={cn(
              "p-1.5 rounded transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}

function findActiveLabel(pathname: string): string {
  for (const section of navSections) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        return item.label;
      }
    }
  }
  return "Alba3ati Admin";
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  const activeLabel = findActiveLabel(pathname);

  const navContent = (
    <>
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-sm">
            A
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-none">Alba3ati</p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-none">
              Admin Console
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4 last:mb-1">
            <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/70">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full transition-opacity",
                        isActive ? "bg-primary opacity-100" : "opacity-0",
                      )}
                    />
                    <Icon
                      size={17}
                      className={cn(
                        "shrink-0 transition-colors",
                        isActive ? item.tone : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-accent/60 transition-colors">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Shield size={15} className="text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-tight truncate">Admin</p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Signed in
            </p>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card/95 backdrop-blur border-b border-border flex items-center px-4">
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 -ml-1.5 rounded-md hover:bg-accent"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="ml-3 flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
            A
          </div>
          <span className="font-semibold text-sm truncate">{activeLabel}</span>
        </div>
      </div>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col h-screen transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-accent z-10"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border flex-col h-screen sticky top-0 shrink-0">
        {navContent}
      </aside>

      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to log out?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLogoutConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

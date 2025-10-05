"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, BarChart3, Search, AlertTriangle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppStore } from "@/store";

/**
 * Navigation item interface
 */
interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

/**
 * Navigation items configuration
 */
const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    description: "Overview and metrics",
  },
  {
    title: "Explorer",
    href: "/explorer",
    icon: Search,
    description: "Investigate agent traces",
  },
  // {
  //   title: "Alerts",
  //   href: "/alerts",
  //   icon: AlertTriangle,
  //   description: "Security alerts and notifications",
  // },
];

/**
 * Main navigation sidebar component
 * Provides fixed-width navigation with SentinelAI branding and theme controls
 */
export function Sidebar() {
  const pathname = usePathname();
  const { setCurrentPage } = useAppStore();

  return (
    <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header with SentinelAI Branding */}
      <div className="p-6 border-b border-sidebar-border">
        <Link
          href="/"
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
        >
          <div className="flex-shrink-0">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">
              SentinelAI
            </h1>
            <p className="text-sm text-muted-foreground">Security Platform</p>
          </div>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (item.href === "/dashboard") setCurrentPage("dashboard");
                else if (item.href === "/explorer") setCurrentPage("explorer");
                else if (item.href === "/alerts") setCurrentPage("alerts");
              }}
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-auto p-3 text-left hover:bg-sidebar-accent",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {item.title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </div>
                </div>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Footer with System Status and Theme Toggle */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        {/* System Status */}
        <div className="flex items-center space-x-2 text-sm">
          <Circle className="h-2 w-2 fill-green-500 text-green-500" />
          <span className="text-sidebar-foreground font-medium">
            System Online
          </span>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

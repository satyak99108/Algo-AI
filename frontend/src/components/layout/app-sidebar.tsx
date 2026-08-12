"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Share2, Brain, Sparkles, MessageSquare } from "lucide-react";
import { ALL_ENTITY_TYPES, ENTITY_CONFIG } from "@/lib/constants";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-foreground/10 bg-background/95 backdrop-blur-md">
      <SidebarHeader className="p-5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center size-8 rounded-full bg-foreground text-background font-mono font-bold text-xs">
            AA
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-display font-bold tracking-tight text-foreground flex items-center gap-1">
              Algo AI
              <span className="font-mono text-[10px] text-muted-foreground">TM</span>
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              v4.0 Operational Engine
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator className="bg-foreground/10" />

      <SidebarContent className="px-2 py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-xs text-muted-foreground/70 uppercase tracking-wider px-3 mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/" />}
                  isActive={pathname === "/"}
                  className="rounded-full px-3 py-2 text-sm font-sans transition-all hover:translate-x-1"
                >
                  <LayoutDashboard className="size-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/copilot" />}
                  isActive={pathname === "/copilot"}
                  className="rounded-full px-3 py-2 text-sm font-sans transition-all hover:translate-x-1"
                >
                  <MessageSquare className="size-4 text-emerald-400" />
                  <span>Company Copilot</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/memory" />}
                  isActive={pathname === "/memory"}
                  className="rounded-full px-3 py-2 text-sm font-sans transition-all hover:translate-x-1"
                >
                  <Sparkles className="size-4 text-amber-400" />
                  <span>Operational Workflows</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/knowledge" />}
                  isActive={pathname === "/knowledge"}
                  className="rounded-full px-3 py-2 text-sm font-sans transition-all hover:translate-x-1"
                >
                  <Share2 className="size-4 text-cyan-400" />
                  <span>Knowledge Graph</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/ingest" />}
                  isActive={pathname === "/ingest"}
                  className="rounded-full px-3 py-2 text-sm font-sans transition-all hover:translate-x-1"
                >
                  <Brain className="size-4 text-purple-400" />
                  <span>Data Ingestion</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-4 bg-foreground/10" />

        {/* Entity Types */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-xs text-muted-foreground/70 uppercase tracking-wider px-3 mb-2">
            Knowledge Schema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {ALL_ENTITY_TYPES.map((type) => {
                const config = ENTITY_CONFIG[type];
                const Icon = config.icon;
                const isActive = pathname.startsWith(`/entities/${type}`);

                return (
                  <SidebarMenuItem key={type}>
                    <SidebarMenuButton
                      render={<Link href={`/entities/${type}`} />}
                      isActive={isActive}
                      className="rounded-full px-3 py-2 text-sm font-sans transition-all hover:translate-x-1"
                    >
                      <Icon className="size-4" style={{ color: config.color }} />
                      <span>{config.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-foreground/10">
        <div className="flex items-center gap-2 px-2 py-1 text-xs font-mono text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Optimus Knowledge Model</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}


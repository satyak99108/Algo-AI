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
import { LayoutDashboard, Share2, Brain } from "lucide-react";
import { ALL_ENTITY_TYPES, ENTITY_CONFIG } from "@/lib/constants";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="flex items-center justify-center size-9 rounded-lg"
            style={{ background: "var(--primary)" }}
          >
            <Brain className="size-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">
              Operational Memory
            </span>
            <span className="text-xs text-muted-foreground">
              Knowledge Model
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/" />} isActive={pathname === "/"}>
                  <LayoutDashboard className="size-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/knowledge" />}
                  isActive={pathname === "/knowledge"}
                >
                  <Share2 className="size-4" />
                  <span>Knowledge Graph</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Entity Types */}
        <SidebarGroup>
          <SidebarGroupLabel>Entities</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ALL_ENTITY_TYPES.map((type) => {
                const config = ENTITY_CONFIG[type];
                const Icon = config.icon;
                const isActive = pathname.startsWith(`/entities/${type}`);

                return (
                  <SidebarMenuItem key={type}>
                    <SidebarMenuButton render={<Link href={`/entities/${type}`} />} isActive={isActive}>
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

      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground text-center">
          Phase 1 — Knowledge Model
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

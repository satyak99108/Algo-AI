import type { Metadata } from "next";
import "./globals.css";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/layout/app-sidebar";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Algo AI ™ — AI Operational Memory Platform",
  description:
    "Algo AI powered operational memory platform for modern engineering and company workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:ital,wght@0,300..700;1,300..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground bg-grid-pattern selection:bg-foreground selection:text-background min-h-screen flex flex-col">
        <TooltipProvider>
          <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <SidebarInset className="bg-transparent flex flex-col min-h-screen">
              {/* Optimus Floating Header Pill Nav */}
              <header className="sticky top-0 z-40 w-full px-4 lg:px-8 pt-4 pb-2 transition-all duration-300">
                <nav className="mx-auto max-w-[1400px] glass-header rounded-full px-6 py-3 flex items-center justify-between shadow-2xl">
                  {/* Brand & Trigger */}
                  <div className="flex items-center gap-4">
                    <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
                    <Link href="/" className="flex items-center gap-2 group">
                      <span className="font-display font-bold tracking-tight text-xl text-foreground group-hover:opacity-90 transition-opacity">
                        Algo AI
                      </span>
                      <span className="text-muted-foreground font-mono text-xs mt-0.5 font-medium">
                        TM
                      </span>
                    </Link>
                  </div>

                  {/* Center Links */}
                  <div className="hidden md:flex items-center gap-8 font-sans text-sm">
                    <Link
                      href="/"
                      className="text-foreground font-medium hover:text-foreground/80 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/copilot"
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="size-3.5 text-emerald-400" />
                      Copilot
                    </Link>
                    <Link
                      href="/memory"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Workflows
                    </Link>
                    <Link
                      href="/knowledge"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Knowledge Graph
                    </Link>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <Link
                      href="/ingest"
                      className="text-xs font-mono text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full border border-foreground/10 hover:border-foreground/30 transition-all hidden sm:inline-block"
                    >
                      Data Ingestion
                    </Link>
                    <Link
                      href="/copilot"
                      className="text-xs font-mono px-4 py-2 rounded-full bg-foreground text-background font-semibold hover:bg-foreground/90 transition-all flex items-center gap-1.5"
                    >
                      Start Copilot
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </nav>
              </header>

              {/* Main Content Viewport */}
              <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
                {children}
              </main>

              {/* Optimus Footer */}
              <footer className="border-t border-foreground/10 mt-20 py-8 px-6 lg:px-12 text-xs font-mono text-muted-foreground">
                <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Algo AI Platform v4.0</span>
                    <span className="text-foreground/30">|</span>
                    <span>Knowledge Model Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>&copy; 2026 Algo AI TM. Built with Optimus Architecture.</span>
                    <span className="text-foreground/30">|</span>
                    <span className="text-foreground font-semibold">Made by Satyak Kumar</span>
                  </div>
                </div>
              </footer>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}


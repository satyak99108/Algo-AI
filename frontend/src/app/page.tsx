"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Sparkles, Brain, Database, Workflow, Share2 } from "lucide-react";
import { api } from "@/lib/api";
import { ALL_ENTITY_TYPES, ENTITY_CONFIG } from "@/lib/constants";
import type { StatsResponse } from "@/types/entities";

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const fetchStats = () => {
      api
        .getStats()
        .then((data) => {
          if (!cancelled) {
            setStats(data);
            setError(null);
            setRetrying(false);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err.message);
            setLoading(false);
            setRetrying(true);
            retryTimer = setTimeout(fetchStats, 3000);
          }
        });
    };

    fetchStats();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  if (loading) {
    return (
      <div className="py-20 space-y-8 max-w-[1200px] mx-auto">
        <div className="space-y-4">
          <div className="h-4 w-40 bg-foreground/10 rounded animate-pulse" />
          <div className="h-16 w-3/4 bg-foreground/10 rounded animate-pulse" />
          <div className="h-6 w-1/2 bg-foreground/10 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 bg-foreground/5 border border-foreground/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 max-w-[800px] mx-auto">
        <div className="p-8 rounded-3xl border border-destructive/30 bg-destructive/5 text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-destructive font-mono text-sm uppercase tracking-wider">
            <Loader2 className="size-4 animate-spin" />
            Backend Connection Warning
          </div>
          <h2 className="text-2xl font-display font-semibold">Unable to reach FastAPI Service</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Ensure backend server is running on{" "}
            <code className="px-2 py-1 bg-foreground/10 rounded text-foreground font-mono text-xs">
              http://localhost:8000
            </code>
          </p>
          {retrying && (
            <p className="text-xs font-mono text-muted-foreground animate-pulse">
              Auto-reconnecting every 3 seconds…
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-24 py-8">
      {/* Optimus Hero Section */}
      <section className="relative pt-6 pb-12 overflow-hidden border-b border-foreground/10">
        <div className="space-y-8">
          {/* Monospace Tag */}
          <div className="inline-flex items-center gap-3 text-xs font-mono text-muted-foreground uppercase tracking-widest">
            <span className="w-8 h-px bg-foreground/30" />
            The Knowledge Engine for Modern Engineering
          </div>

          {/* Huge Display Heading */}
          <h1 className="text-[clamp(2.5rem,7vw,6rem)] font-display leading-[0.95] tracking-tight font-normal">
            <span className="block text-foreground">Algo AI</span>
            <span className="block text-muted-foreground">
              to{" "}
              <span className="relative inline-block text-foreground font-medium">
                innovate.
                <span className="absolute -bottom-2 left-0 right-0 h-2 bg-foreground/15 rounded-full" />
              </span>
            </span>
          </h1>

          {/* Subtitle & CTA Grid */}
          <div className="grid lg:grid-cols-2 gap-8 items-end pt-4">
            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-xl">
              Understand how your company operates. Extract entities, map relationships, and execute complex cross-department workflows with AI.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/copilot"
                className="inline-flex items-center justify-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-7 py-3.5 rounded-full font-medium text-sm transition-all duration-300 group shadow-lg"
              >
                Open Copilot
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/knowledge"
                className="inline-flex items-center justify-center gap-2 border border-foreground/20 hover:bg-foreground/5 text-foreground px-7 py-3.5 rounded-full font-medium text-sm transition-all duration-300"
              >
                <Share2 className="size-4 text-cyan-400" />
                Explore Knowledge Graph
              </Link>
            </div>
          </div>
        </div>

        {/* Optimus Live Marquee Ticker */}
        <div className="mt-16 pt-8 border-t border-foreground/10 overflow-hidden">
          <div className="flex gap-16 animate-marquee whitespace-nowrap font-sans text-xs">
            <div className="flex items-center gap-12 text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="text-xl font-display font-semibold text-foreground">
                  {stats?.total_entities || 0}
                </span>
                <span>Entities Modeled <span className="font-mono text-[10px] block text-emerald-400">ACTIVE</span></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-display font-semibold text-foreground">
                  {stats?.relationships || 0}
                </span>
                <span>Graph Edges <span className="font-mono text-[10px] block text-cyan-400">CONNECTED</span></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-display font-semibold text-foreground">
                  8
                </span>
                <span>Schema Types <span className="font-mono text-[10px] block text-amber-400">INDEXED</span></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-display font-semibold text-foreground">
                  &lt;12ms
                </span>
                <span>Query Latency <span className="font-mono text-[10px] block text-purple-400">OPTIMIZED</span></span>
              </div>
            </div>
            {/* Repeat ticker items for seamless loop */}
            <div className="flex items-center gap-12 text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="text-xl font-display font-semibold text-foreground">
                  {stats?.total_entities || 0}
                </span>
                <span>Entities Modeled <span className="font-mono text-[10px] block text-emerald-400">ACTIVE</span></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-display font-semibold text-foreground">
                  {stats?.relationships || 0}
                </span>
                <span>Graph Edges <span className="font-mono text-[10px] block text-cyan-400">CONNECTED</span></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-display font-semibold text-foreground">
                  8
                </span>
                <span>Schema Types <span className="font-mono text-[10px] block text-amber-400">INDEXED</span></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-display font-semibold text-foreground">
                  &lt;12ms
                </span>
                <span>Query Latency <span className="font-mono text-[10px] block text-purple-400">OPTIMIZED</span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Optimus Capabilities Grid Section */}
      <section className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-foreground/10">
          <div>
            <div className="inline-flex items-center gap-3 text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
              <span className="w-8 h-px bg-foreground/30" />
              Capabilities
            </div>
            <h2 className="text-3xl lg:text-5xl font-display tracking-tight">
              Knowledge Schema Overview
            </h2>
          </div>
          <p className="text-sm font-mono text-muted-foreground">
            Explore active entities categorized by domain schema
          </p>
        </div>

        {/* Entity Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ALL_ENTITY_TYPES.map((type, index) => {
            const config = ENTITY_CONFIG[type];
            const Icon = config.icon;
            const count = stats?.[type as keyof StatsResponse] || 0;
            const itemNumber = String(index + 1).padStart(2, "0");

            return (
              <Link key={type} href={`/entities/${type}`}>
                <div className="group relative p-6 rounded-3xl border border-foreground/10 bg-card/60 hover:bg-foreground/[0.04] transition-all duration-500 hover:-translate-y-1 flex flex-col justify-between h-52">
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      {itemNumber}
                    </span>
                    <div
                      className="size-9 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{
                        background: config.bgColor,
                        border: `1px solid ${config.borderColor}`,
                      }}
                    >
                      <Icon className="size-4.5" style={{ color: config.color }} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-display font-semibold text-foreground mb-1 group-hover:translate-x-1 transition-transform">
                      {config.label}
                    </h3>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-foreground/5">
                      <span className="text-2xl font-display font-bold text-foreground">
                        {count as number}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
                        Inspect <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Optimus Process / Core Pillars Section */}
      <section className="p-8 lg:p-12 rounded-3xl border border-foreground/10 bg-foreground/[0.02] space-y-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 text-xs font-mono text-muted-foreground uppercase tracking-widest">
            <span className="w-8 h-px bg-foreground/30" />
            Architecture
          </div>
          <h2 className="text-3xl lg:text-4xl font-display tracking-tight">
            How Operational Memory Works
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-4 p-6 rounded-2xl border border-foreground/10 bg-card/40 hover:bg-card transition-all">
            <span className="font-display text-3xl font-light text-muted-foreground">I</span>
            <h3 className="text-xl font-display font-semibold">1. Unstructured Ingestion</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Upload raw documents, meeting notes, project specs, and PRDs. Gemini extracts rich entities automatically.
            </p>
          </div>

          <div className="space-y-4 p-6 rounded-2xl border border-foreground/10 bg-card/40 hover:bg-card transition-all">
            <span className="font-display text-3xl font-light text-muted-foreground">II</span>
            <h3 className="text-xl font-display font-semibold">2. Graph Model Builder</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Connect people, decisions, projects, and tasks into a unified living company knowledge graph.
            </p>
          </div>

          <div className="space-y-4 p-6 rounded-2xl border border-foreground/10 bg-card/40 hover:bg-card transition-all">
            <span className="font-display text-3xl font-light text-muted-foreground">III</span>
            <h3 className="text-xl font-display font-semibold">3. AI Copilot Execution</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Query organizational memory to find ownership, trace decision history, and generate automated workflows.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}


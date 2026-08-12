"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Brain,
  Search,
  Clock,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { ENTITY_CONFIG, ALL_ENTITY_TYPES } from "@/lib/constants";
import type { EntityType, MemoryItem, MemoryTimelineItem } from "@/types/entities";

export default function OperationalMemoryPage() {
  const [query, setQuery] = useState("");
  const [selectedEntityType, setSelectedEntityType] = useState<string>("all");
  const [confidenceFilter, setConfidenceFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("memories");

  const minConfidence = useMemo(() => {
    switch (confidenceFilter) {
      case "high":
        return 0.7;
      case "very_high":
        return 0.85;
      case "verified":
        return 0.95;
      default:
        return 0;
    }
  }, [confidenceFilter]);

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [timeline, setTimeline] = useState<MemoryTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMemory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.searchMemory({
        query: query.trim() || undefined,
        min_confidence: minConfidence > 0 ? minConfidence : undefined,
        entity_type: selectedEntityType !== "all" ? selectedEntityType : undefined,
        page_size: 50,
      });
      setMemories(res.items);

      const timelineRes = await api.getMemoryTimeline(50);
      setTimeline(timelineRes);
    } catch (err: any) {
      setError(err.message || "Failed to load operational memory");
    } finally {
      setLoading(false);
    }
  }, [query, minConfidence, selectedEntityType]);

  useEffect(() => {
    fetchMemory();
  }, [fetchMemory]);

  const avgConfidence = useMemo(() => {
    if (memories.length === 0) return 0;
    const sum = memories.reduce((acc, m) => acc + m.confidence, 0);
    return Math.round((sum / memories.length) * 100);
  }, [memories]);

  const highConfidenceCount = useMemo(() => {
    return memories.filter((m) => m.confidence >= 0.85).length;
  }, [memories]);

  return (
    <div className="flex flex-col gap-8 py-4 max-w-[1300px] mx-auto animate-fade-in">
      {/* Optimus Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-foreground/10">
        <div>
          <div className="inline-flex items-center gap-3 text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">
            <span className="w-8 h-px bg-foreground/30" />
            Operational Memory Layer
          </div>
          <h1 className="text-3xl lg:text-5xl font-display tracking-tight flex items-center gap-3">
            Operational Workflows
            <span className="text-xs font-mono px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              ● Active Layer
            </span>
          </h1>
        </div>

        <Button
          onClick={fetchMemory}
          disabled={loading}
          className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-mono text-xs px-5 h-10 gap-2 shrink-0 transition-all"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Sync Memory State
        </Button>
      </div>

      {/* Optimus Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-foreground/10 bg-card/60 space-y-2">
          <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
            <span>01</span>
            <span className="uppercase">Extracted Facts</span>
          </div>
          <p className="text-4xl font-display font-bold text-foreground">{memories.length}</p>
          <p className="text-xs text-muted-foreground">Mapped facts & relationships</p>
        </div>

        <div className="p-6 rounded-3xl border border-foreground/10 bg-card/60 space-y-2">
          <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
            <span>02</span>
            <span className="uppercase">Average Certainty</span>
          </div>
          <p className="text-4xl font-display font-bold text-emerald-400">{avgConfidence}%</p>
          <p className="text-xs text-muted-foreground">Evidence confidence rating</p>
        </div>

        <div className="p-6 rounded-3xl border border-foreground/10 bg-card/60 space-y-2">
          <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
            <span>03</span>
            <span className="uppercase">Verified Nodes</span>
          </div>
          <p className="text-4xl font-display font-bold text-cyan-400">{highConfidenceCount}</p>
          <p className="text-xs text-muted-foreground">&ge; 85% confidence score</p>
        </div>
      </div>

      {/* Optimus Floating Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl border border-foreground/10 bg-card/60">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search operational memory, entity names, or evidence facts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 rounded-full border-foreground/15 bg-background/50 focus:border-foreground text-xs font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Select value={selectedEntityType} onValueChange={(val) => setSelectedEntityType(val || "all")}>
            <SelectTrigger className="w-[160px] rounded-full border-foreground/15 bg-background/50 text-xs font-mono">
              <SelectValue placeholder="All Schema Types" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Schema Types</SelectItem>
              {ALL_ENTITY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {ENTITY_CONFIG[type].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={confidenceFilter}
            onValueChange={(val) => setConfidenceFilter(val || "all")}
          >
            <SelectTrigger className="w-[170px] rounded-full border-foreground/15 bg-background/50 text-xs font-mono">
              <SelectValue placeholder="All Confidence" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Confidence</SelectItem>
              <SelectItem value="high">High (&gt;70%)</SelectItem>
              <SelectItem value="very_high">Very High (&gt;85%)</SelectItem>
              <SelectItem value="verified">Verified (&gt;95%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-foreground/5 p-1 rounded-full border border-foreground/10 inline-flex">
          <TabsTrigger value="memories" className="rounded-full text-xs font-mono px-5 py-2 data-[state=active]:bg-foreground data-[state=active]:text-background">
            <Brain className="size-3.5 mr-2" /> Extracted Memories ({memories.length})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-full text-xs font-mono px-5 py-2 data-[state=active]:bg-foreground data-[state=active]:text-background">
            <Clock className="size-3.5 mr-2" /> Learning Timeline
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Extracted Memories Grid */}
        <TabsContent value="memories" className="mt-0">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-44 rounded-3xl border border-foreground/10 bg-card/40 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 rounded-3xl border border-destructive/30 bg-destructive/5 text-center text-destructive font-mono text-xs">
              {error}
            </div>
          ) : memories.length === 0 ? (
            <div className="p-12 rounded-3xl border border-foreground/10 bg-card/40 text-center space-y-4">
              <Brain className="size-10 text-muted-foreground mx-auto opacity-50" />
              <div className="space-y-1">
                <p className="font-display font-semibold text-lg">No operational memories found</p>
                <p className="text-xs font-mono text-muted-foreground">
                  Ingest Slack messages or documents in the Data Ingestion tab to extract structured memory facts.
                </p>
              </div>
              <Link href="/ingest" className="inline-flex items-center text-xs font-mono px-5 py-2.5 rounded-full bg-foreground text-background font-medium hover:bg-foreground/90 transition-all">
                Go to Data Ingestion <ArrowRight className="size-3.5 ml-2" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {memories.map((item, idx) => {
                const typeConfig = ENTITY_CONFIG[item.entity_type as EntityType];
                const Icon = typeConfig?.icon || Brain;
                const confidencePct = Math.round(item.confidence * 100);
                const numStr = String(idx + 1).padStart(2, "0");

                return (
                  <div key={item.id} className="p-6 rounded-3xl border border-foreground/10 bg-card/60 hover:bg-foreground/[0.03] transition-all duration-300 hover:-translate-y-1 space-y-4 flex flex-col justify-between group">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-muted-foreground">{numStr}</span>
                        <span className="px-3 py-1 rounded-full text-xs font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                          {confidencePct}% Confidence
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className="size-9 rounded-2xl flex items-center justify-center shrink-0"
                          style={{
                            background: typeConfig ? `${typeConfig.color}20` : "var(--primary-20)",
                          }}
                        >
                          <Icon className="size-4.5" style={{ color: typeConfig?.color }} />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                            {typeConfig?.labelSingular || item.entity_type}
                          </span>
                          <Link
                            href={`/entities/${item.entity_type}/${item.entity_id}`}
                            className="font-display font-semibold text-lg text-foreground group-hover:translate-x-1 transition-transform inline-block"
                          >
                            {item.entity_name}
                          </Link>
                        </div>
                      </div>

                      {item.relationship && (
                        <div className="p-3 rounded-xl bg-background/50 border border-foreground/10 text-xs font-mono flex items-center gap-2">
                          <span className="font-semibold text-foreground">{item.relationship.source_name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase px-2 py-0.5 rounded-full border border-foreground/15">
                            {item.relationship.relationship_type.replace(/_/g, " ")}
                          </span>
                          <span className="font-semibold text-foreground">{item.relationship.target_name}</span>
                        </div>
                      )}

                      {item.evidence_text && (
                        <div className="p-4 rounded-2xl bg-background/70 border border-foreground/10 text-xs italic text-foreground/90 font-sans leading-relaxed">
                          &ldquo;{item.evidence_text}&rdquo;
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-foreground/5 flex items-center justify-between text-xs font-mono text-muted-foreground">
                      <span className="truncate max-w-[200px]" title={item.source_name}>
                        Source: {item.source_name}
                      </span>
                      <span className="capitalize">{item.source_type}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Learning Timeline */}
        <TabsContent value="timeline" className="mt-0">
          <div className="p-8 rounded-3xl border border-foreground/10 bg-card/60 space-y-6">
            <div>
              <h3 className="font-display font-semibold text-xl">Operational Memory Stream</h3>
              <p className="text-xs font-mono text-muted-foreground mt-1">Chronological extraction logs</p>
            </div>

            {timeline.length === 0 ? (
              <p className="text-xs font-mono text-muted-foreground text-center py-10">
                No timeline records logged yet.
              </p>
            ) : (
              <div className="relative pl-6 border-l border-foreground/20 space-y-6">
                {timeline.map((item, idx) => (
                  <div key={item.id || idx} className="relative space-y-2">
                    <div className="absolute -left-[31px] top-1 size-2.5 rounded-full bg-foreground" />
                    <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                      <span>{new Date(item.timestamp).toLocaleString()}</span>
                      <span className="px-2 py-0.5 rounded-full border border-foreground/15 text-foreground uppercase">{item.entity_type}</span>
                      <span className="text-emerald-400">{Math.round(item.confidence * 100)}% Match</span>
                    </div>
                    <p className="font-display font-semibold text-base text-foreground">
                      Learned entity: <span className="text-cyan-400">{item.entity_name}</span>
                    </p>
                    {item.evidence_text && (
                      <p className="p-3 rounded-xl bg-background/50 border border-foreground/10 text-xs italic font-sans text-muted-foreground">
                        &ldquo;{item.evidence_text}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Brain,
  Search,
  Sparkles,
  ShieldCheck,
  FileText,
  Clock,
  Filter,
  RefreshCw,
  ArrowUpRight,
  Layers,
  Quote,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { ENTITY_CONFIG, ALL_ENTITY_TYPES } from "@/lib/constants";
import type { EntityType, MemoryItem, MemoryTimelineItem, EvidenceRecord } from "@/types/entities";

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

  // Fetch memory search
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

  // Statistics summaries
  const avgConfidence = useMemo(() => {
    if (memories.length === 0) return 0;
    const sum = memories.reduce((acc, m) => acc + m.confidence, 0);
    return Math.round((sum / memories.length) * 100);
  }, [memories]);

  const highConfidenceCount = useMemo(() => {
    return memories.filter((m) => m.confidence >= 0.85).length;
  }, [memories]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary shrink-0">
            <Sparkles className="size-6 text-emerald-400" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Operational Memory</h1>
              <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                <CheckCircle2 className="size-3" />
                Phase 3 Layer
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Structured operational memory extracted from company communications, documents, and tasks — fully explainable with confidence scores and source evidence.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchMemory}
          disabled={loading}
          className="gap-2 shrink-0 self-start md:self-auto"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} data-icon="inline-start" />
          Refresh Memory
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium">Total Extracted Memories</CardDescription>
            <CardTitle className="text-2xl font-bold text-primary">{memories.length}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-muted-foreground">Facts & relationships with provenance</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium">Average Confidence</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-400">{avgConfidence}%</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-muted-foreground">AI extraction certainty score</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium">High Confidence Facts</CardDescription>
            <CardTitle className="text-2xl font-bold text-cyan-400">{highConfidenceCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-muted-foreground">&ge; 85% verified evidence confidence</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card border border-border p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search operational memory, entities, or evidence..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Entity Type Filter */}
          <Select value={selectedEntityType} onValueChange={(val) => setSelectedEntityType(val || "all")}>
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {ALL_ENTITY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {ENTITY_CONFIG[type].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Confidence Filter */}
          <Select
            value={confidenceFilter}
            onValueChange={(val) => setConfidenceFilter(val || "all")}
          >
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="All Confidence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Confidence</SelectItem>
              <SelectItem value="high">High Confidence</SelectItem>
              <SelectItem value="very_high">Very High Confidence</SelectItem>
              <SelectItem value="verified">Verified Confidence</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-4">
        <TabsList className="w-full sm:w-auto self-start bg-card border border-border">
          <TabsTrigger value="memories" className="gap-2">
            <Brain className="size-4" />
            Extracted Memories ({memories.length})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Clock className="size-4" />
            Learning Timeline
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Extracted Memories Grid */}
        <TabsContent value="memories" className="flex flex-col gap-4 mt-0">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-6 flex flex-col gap-3">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-16 w-full" />
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="p-8 text-center text-destructive">{error}</Card>
          ) : memories.length === 0 ? (
            <Card className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <Brain className="size-10 text-muted-foreground opacity-50" />
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-lg">No operational memories found</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Ingest Slack messages or documents in the Data Ingestion tab to extract structured memory facts.
                </p>
              </div>
              <Button render={<Link href="/ingest" />} variant="outline" className="mt-2">
                Go to Data Ingestion
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memories.map((item) => {
                const typeConfig = ENTITY_CONFIG[item.entity_type as EntityType];
                const Icon = typeConfig?.icon || Brain;
                const confidencePct = Math.round(item.confidence * 100);

                return (
                  <Card key={item.id} className="flex flex-col justify-between overflow-hidden border-border transition-all duration-200 hover:border-primary/40 shadow-sm">
                    <CardHeader className="p-5 pb-3 flex flex-row items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className="flex items-center justify-center size-9 rounded-lg shrink-0 mt-0.5"
                          style={{
                            background: typeConfig ? `${typeConfig.color}20` : "var(--primary-20)",
                          }}
                        >
                          <Icon className="size-4" style={{ color: typeConfig?.color }} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {typeConfig?.labelSingular || item.entity_type}
                          </span>
                          <Link
                            href={`/entities/${item.entity_type}/${item.entity_id}`}
                            className="font-bold text-base hover:text-primary transition-colors truncate"
                          >
                            {item.entity_name}
                          </Link>
                        </div>
                      </div>

                      {/* Confidence Badge */}
                      <Badge
                        variant="outline"
                        className={`shrink-0 gap-1 text-xs font-mono px-2.5 py-1 border ${
                          confidencePct >= 85
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : confidencePct >= 65
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-red-500/10 text-red-400 border-red-500/30"
                        }`}
                      >
                        <ShieldCheck className="size-3.5" />
                        {confidencePct}% Confidence
                      </Badge>
                    </CardHeader>

                    <CardContent className="px-5 py-3 flex flex-col gap-3">
                      {/* Relationship / Fact Summary */}
                      {item.relationship ? (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 text-xs font-medium border border-border/50">
                          <span className="font-semibold text-foreground">{item.relationship.source_name}</span>
                          <Badge variant="secondary" className="text-[10px] uppercase font-mono px-1.5 py-0.5">
                            {item.relationship.relationship_type.replace(/_/g, " ")}
                          </Badge>
                          <span className="font-semibold text-foreground">{item.relationship.target_name}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                          <Layers className="size-3.5 text-primary" />
                          <span>Structured entity record mapped in operational memory</span>
                        </div>
                      )}

                      {/* Evidence Quote */}
                      {item.evidence_text && (
                        <div className="flex gap-2.5 p-3 rounded-xl bg-background/80 border border-border/60 text-xs text-muted-foreground italic">
                          <Quote className="size-4 text-emerald-400 shrink-0 mt-0.5 opacity-70" />
                          <p className="line-clamp-3 leading-relaxed text-foreground/90">
                            &ldquo;{item.evidence_text}&rdquo;
                          </p>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="px-5 py-3 bg-muted/20 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="size-3.5 text-primary shrink-0" />
                        <span className="truncate" title={item.source_name}>
                          {item.source_name}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                          {item.source_type}
                        </Badge>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Learning Timeline */}
        <TabsContent value="timeline" className="mt-0">
          <Card className="p-6">
            <CardHeader className="px-0 pt-0 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clock className="size-5 text-primary" />
                Operational Memory Extraction History
              </CardTitle>
              <CardDescription>
                Chronological audit stream of facts, responsibilities, and relationships learned by the system.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-0 pb-0">
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No memory extraction events recorded yet.
                </p>
              ) : (
                <div className="relative pl-6 border-l-2 border-border flex flex-col gap-6">
                  {timeline.map((item, idx) => (
                    <div key={item.id || idx} className="relative flex flex-col gap-1.5">
                      {/* Dot marker */}
                      <div className="absolute -left-[31px] top-1 size-3.5 rounded-full bg-primary ring-4 ring-background" />

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono text-muted-foreground">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                          {item.entity_type}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-0">
                          {Math.round(item.confidence * 100)}% Confidence
                        </Badge>
                      </div>

                      <div className="font-semibold text-sm">
                        Learned fact about <span className="text-primary">{item.entity_name}</span>
                      </div>

                      {item.evidence_text && (
                        <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/40 font-mono">
                          &ldquo;{item.evidence_text}&rdquo;
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <FileText className="size-3" />
                        <span>Source document: {item.source_name} ({item.source_type})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

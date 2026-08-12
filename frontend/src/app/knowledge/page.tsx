"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  MarkerType,
  ConnectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  RefreshCw,
  Search,
  FileText,
  ExternalLink,
  Quote,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { ENTITY_CONFIG, ALL_ENTITY_TYPES } from "@/lib/constants";
import type { EntityType, GraphResponse, EvidenceRecord } from "@/types/entities";
import { useRouter } from "next/navigation";

// Custom entity node component with confidence indicator
function EntityNode({ data }: NodeProps) {
  const entityType = data.entityType as EntityType;
  const config = ENTITY_CONFIG[entityType];
  const confidence = (data.confidence as number) || 0.9;
  const confidencePct = Math.round(confidence * 100);

  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className="group cursor-pointer min-w-[150px]">
      <Handle type="target" position={Position.Top} className="!bg-border" />
      <div
        className="flex flex-col gap-1.5 px-3.5 py-2.5 rounded-2xl border transition-all duration-300 hover:scale-105 shadow-xl"
        style={{
          background: config.bgColor,
          borderColor: config.borderColor,
          boxShadow: `0 0 16px ${config.bgColor}`,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center size-7 rounded-xl"
              style={{ background: `${config.color}22` }}
            >
              <Icon className="size-3.5" style={{ color: config.color }} />
            </div>
            <div className="flex flex-col min-w-0">
              <span
                className="text-xs font-display font-semibold truncate max-w-[110px]"
                style={{ color: config.color }}
              >
                {data.label as string}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {config.labelSingular}
              </span>
            </div>
          </div>
        </div>

        {/* Confidence Indicator Bar */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
          <div className="flex-1 h-1 rounded-full bg-background/50 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                confidencePct >= 85
                  ? "bg-emerald-400"
                  : confidencePct >= 65
                  ? "bg-amber-400"
                  : "bg-red-400"
              }`}
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <span className="text-[9px] font-mono text-muted-foreground font-semibold">
            {confidencePct}%
          </span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </div>
  );
}

const nodeTypes = { entity: EntityNode };

export default function KnowledgeGraphPage() {
  const router = useRouter();
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [confidenceFilter, setConfidenceFilter] = useState<string>("all");

  const minConfidence = useMemo(() => {
    switch (confidenceFilter) {
      case "high":
        return 0.7;
      case "very_high":
        return 0.85;
      default:
        return 0;
    }
  }, [confidenceFilter]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null);
  const [selectedEdgeData, setSelectedEdgeData] = useState<any | null>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const fetchGraph = useCallback(() => {
    setLoading(true);
    api
      .getGraph()
      .then((data) => {
        setGraphData(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  useEffect(() => {
    if (!graphData) return;

    const query = searchTerm.toLowerCase().trim();

    const directMatchNodeIds = new Set<string>();
    if (query) {
      graphData.nodes.forEach((n) => {
        if (n.data.label.toLowerCase().includes(query)) {
          directMatchNodeIds.add(n.id);
        }
      });
    }

    const connectedNodeIds = new Set<string>(directMatchNodeIds);
    if (query && directMatchNodeIds.size > 0) {
      graphData.edges.forEach((e) => {
        if (directMatchNodeIds.has(e.source)) {
          connectedNodeIds.add(e.target);
        }
        if (directMatchNodeIds.has(e.target)) {
          connectedNodeIds.add(e.source);
        }
      });
    }

    const filteredNodes: Node[] = graphData.nodes
      .filter((n) => {
        const matchesType = selectedType === "all" || n.data.entityType === selectedType;
        const matchesSearch = !query || connectedNodeIds.has(n.id);
        const nodeConfidence = n.data.confidence || 0.9;
        const matchesConfidence = nodeConfidence >= minConfidence;
        return matchesType && matchesSearch && matchesConfidence;
      })
      .map((n) => ({
        id: n.id,
        type: "entity",
        position: n.position || { x: 0, y: 0 },
        data: n.data,
      }));

    const validNodeIds = new Set(filteredNodes.map((n) => n.id));

    const filteredEdges: Edge[] = graphData.edges
      .filter(
        (e) =>
          validNodeIds.has(e.source) &&
          validNodeIds.has(e.target) &&
          ((e.data?.confidence as number) || 0.88) >= minConfidence
      )
      .map((e) => {
        const edgeConfidence = (e.data?.confidence as number) || 0.88;
        const strokeColor =
          edgeConfidence >= 0.85
            ? "oklch(0.7 0.16 160)"
            : edgeConfidence >= 0.65
            ? "oklch(0.75 0.16 70)"
            : "oklch(0.5 0 0)";

        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: `${e.label.replace(/_/g, " ")} (${Math.round(edgeConfidence * 100)}%)`,
          type: "default",
          animated: true,
          style: { stroke: strokeColor, strokeWidth: 1.8 },
          labelStyle: {
            fontSize: 9,
            fill: "oklch(0.9 0 0)",
            fontWeight: 600,
            fontFamily: "monospace",
          },
          labelBgStyle: {
            fill: "oklch(0.12 0 0)",
            fillOpacity: 0.95,
          },
          labelBgPadding: [6, 3] as [number, number],
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: strokeColor,
          },
          data: e.data,
        };
      });

    setNodes(filteredNodes);
    setEdges(filteredEdges);
  }, [graphData, selectedType, searchTerm, minConfidence, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as any;
      setSelectedNodeData(data);
      setSelectedEdgeData(null);
      setSheetOpen(true);

      setLoadingEvidence(true);
      api
        .getEntityEvidence(data.entityType, data.entityId)
        .then((records) => setEvidenceList(records))
        .catch(() => setEvidenceList([]))
        .finally(() => setLoadingEvidence(false));
    },
    []
  );

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedEdgeData(edge);
      setSelectedNodeData(null);
      setSheetOpen(true);

      setLoadingEvidence(true);
      api
        .getRelationshipEvidence(edge.id)
        .then((records) => setEvidenceList(records))
        .catch(() => setEvidenceList([]))
        .finally(() => setLoadingEvidence(false));
    },
    []
  );

  const activeLegendTypes = useMemo(() => {
    if (!graphData) return [];
    const types = new Set(graphData.nodes.map((n) => n.data.entityType));
    return ALL_ENTITY_TYPES.filter((t) => types.has(t));
  }, [graphData]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in py-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-foreground/10">
        <div>
          <div className="inline-flex items-center gap-3 text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">
            <span className="w-8 h-px bg-foreground/30" />
            Knowledge Architecture
          </div>
          <h1 className="text-3xl lg:text-5xl font-display tracking-tight">
            Knowledge Graph Explorer
          </h1>
        </div>

        <Button
          onClick={fetchGraph}
          disabled={loading}
          className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-mono text-xs px-5 h-10 gap-2 shrink-0 transition-all"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Graph State
        </Button>
      </div>

      {/* Optimus Floating Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl border border-foreground/10 bg-card/60">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes by entity name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-full border-foreground/15 bg-background/50 focus:border-foreground text-xs font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Entity Type Filter */}
          <Select value={selectedType} onValueChange={(val) => setSelectedType(val || "all")}>
            <SelectTrigger className="w-[160px] rounded-full border-foreground/15 bg-background/50 text-xs font-mono">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Schema Types</SelectItem>
              {ALL_ENTITY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {ENTITY_CONFIG[t].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Min Confidence Threshold */}
          <Select
            value={confidenceFilter}
            onValueChange={(val) => setConfidenceFilter(val || "all")}
          >
            <SelectTrigger className="w-[170px] rounded-full border-foreground/15 bg-background/50 text-xs font-mono">
              <SelectValue placeholder="All Confidence" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Confidence</SelectItem>
              <SelectItem value="high">High Confidence (&gt;70%)</SelectItem>
              <SelectItem value="very_high">Very High (&gt;85%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Legend Bar & Counts */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="flex flex-wrap items-center gap-2">
          {activeLegendTypes.map((type) => {
            const cfg = ENTITY_CONFIG[type];
            const Ic = cfg.icon;
            return (
              <span
                key={type}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono"
                style={{ borderColor: `${cfg.color}44`, background: `${cfg.color}11` }}
              >
                <Ic className="size-3" style={{ color: cfg.color }} />
                <span className="text-foreground">{cfg.label}</span>
              </span>
            );
          })}
        </div>

        {graphData && (
          <div className="text-xs font-mono text-muted-foreground flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {nodes.length} Nodes Rendered
            </span>
            <span className="text-foreground/20">|</span>
            <span>{edges.length} Edges</span>
          </div>
        )}
      </div>

      {/* ReactFlow Graph Canvas Container */}
      <div className="rounded-3xl border border-foreground/10 overflow-hidden bg-card/40">
        <div className="h-[calc(100vh-320px)] min-h-[550px] relative">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <p className="text-destructive font-mono text-sm">{error}</p>
                <p className="text-xs text-muted-foreground">Check backend server connection at localhost:8000</p>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              nodeTypes={nodeTypes}
              connectionMode={ConnectionMode.Loose}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.3}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
              style={{ background: "oklch(0.11 0 0)" }}
            >
              <Background color="oklch(1 0 0 / 0.06)" gap={32} size={1} />
              <Controls
                showInteractive={false}
                className="!bg-card !border-foreground/10 !rounded-2xl !shadow-xl"
              />
              <MiniMap
                nodeColor={(node) => {
                  const type = (node.data as { entityType?: string })
                    ?.entityType as EntityType;
                  const cfg = ENTITY_CONFIG[type];
                  return cfg?.color || "oklch(0.5 0 0)";
                }}
                maskColor="oklch(0.1 0 0 / 0.8)"
                className="!bg-card !border-foreground/10 !rounded-2xl"
              />
            </ReactFlow>
          )}
        </div>
      </div>

      {/* Operational Memory Provenance Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md p-6 overflow-y-auto flex flex-col gap-6 bg-background border-l border-foreground/10">
          <SheetHeader className="p-0 gap-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 inline-flex items-center gap-1.5">
                <Sparkles className="size-3" />
                Graph Provenance Model
              </span>
            </div>
            <SheetTitle className="text-xl font-display font-bold tracking-tight text-foreground">
              {selectedNodeData ? selectedNodeData.label : selectedEdgeData?.label || "Memory Provenance"}
            </SheetTitle>
            <SheetDescription className="text-xs font-mono text-muted-foreground">
              {selectedNodeData
                ? `Entity type: ${selectedNodeData.entityType}`
                : "Relationship evidence trace"}
            </SheetDescription>
          </SheetHeader>

          {/* Node Summary Card */}
          {selectedNodeData && (
            <div className="p-4 rounded-2xl bg-card/60 border border-foreground/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">Confidence Score</span>
                <span className="px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold">
                  {Math.round((selectedNodeData.confidence || 0.9) * 100)}%
                </span>
              </div>

              {selectedNodeData.evidence && (
                <div className="space-y-1 text-xs">
                  <span className="font-mono text-muted-foreground uppercase text-[10px]">Fact Quote</span>
                  <p className="p-3 rounded-xl bg-background/80 border border-foreground/10 text-foreground italic font-sans leading-relaxed">
                    &ldquo;{selectedNodeData.evidence}&rdquo;
                  </p>
                </div>
              )}

              <Button
                onClick={() => {
                  setSheetOpen(false);
                  router.push(`/entities/${selectedNodeData.entityType}/${selectedNodeData.entityId}`);
                }}
                className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 font-mono text-xs h-10 gap-2 mt-2"
              >
                View Full Entity Record
                <ExternalLink className="size-3.5" />
              </Button>
            </div>
          )}

          {/* Evidence Records List */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileText className="size-3.5 text-cyan-400" />
              Source Documents ({evidenceList.length})
            </h3>

            {loadingEvidence ? (
              <div className="space-y-3">
                <div className="h-16 rounded-2xl bg-card/50 animate-pulse" />
                <div className="h-16 rounded-2xl bg-card/50 animate-pulse" />
              </div>
            ) : evidenceList.length === 0 ? (
              <p className="text-xs font-mono text-muted-foreground p-6 text-center border border-dashed border-foreground/15 rounded-2xl">
                No direct evidence records linked to this node.
              </p>
            ) : (
              <div className="space-y-3">
                {evidenceList.map((ev) => (
                  <div key={ev.id} className="p-4 rounded-2xl bg-card/60 border border-foreground/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-semibold text-foreground truncate max-w-[200px]" title={ev.source_name}>
                        {ev.source_name}
                      </span>
                      <span className="text-[10px] text-emerald-400">
                        {Math.round(ev.confidence * 100)}% Match
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-background/80 border border-foreground/10 text-foreground italic flex gap-2">
                      <Quote className="size-3 text-cyan-400 shrink-0 mt-0.5" />
                      <p className="line-clamp-4 leading-relaxed font-sans">&ldquo;{ev.evidence_text}&rdquo;</p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-1">
                      <span className="capitalize">Source: {ev.source_type}</span>
                      <span>{new Date(ev.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}


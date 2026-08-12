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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  ShieldCheck,
  FileText,
  ExternalLink,
  Quote,
  Sparkles,
  Layers,
  ArrowRight,
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
        className="flex flex-col gap-1.5 px-3 py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 shadow-md"
        style={{
          background: config.bgColor,
          borderColor: config.borderColor,
          boxShadow: `0 0 14px ${config.bgColor}`,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center size-7 rounded-md"
              style={{ background: `${config.color}22` }}
            >
              <Icon className="size-3.5" style={{ color: config.color }} />
            </div>
            <div className="flex flex-col min-w-0">
              <span
                className="text-xs font-bold truncate max-w-[110px]"
                style={{ color: config.color }}
              >
                {data.label as string}
              </span>
              <span className="text-[10px] text-muted-foreground">
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

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [minConfidence, setMinConfidence] = useState<number>(0);

  // Side Sheet state for evidence inspection
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

  // Apply filters to nodes and edges
  useEffect(() => {
    if (!graphData) return;

    // Filter nodes
    const filteredNodes: Node[] = graphData.nodes
      .filter((n) => {
        const matchesType = selectedType === "all" || n.data.entityType === selectedType;
        const matchesSearch =
          !searchTerm.trim() ||
          n.data.label.toLowerCase().includes(searchTerm.toLowerCase().trim());
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

    // Filter edges
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
            ? "oklch(0.6 0.15 160)" // Emerald tint
            : edgeConfidence >= 0.65
            ? "oklch(0.65 0.15 70)" // Amber tint
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
            fill: "oklch(0.8 0 0)",
            fontWeight: 600,
          },
          labelBgStyle: {
            fill: "oklch(0.18 0 0)",
            fillOpacity: 0.92,
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

  // Click node to open evidence sheet
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

  // Click edge to open evidence sheet
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
    <div className="flex flex-col gap-4 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Graph</h1>
          <p className="text-sm text-muted-foreground">
            Interactive visualization of operational memory, confidence scores, and evidence chains
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchGraph}
          disabled={loading}
          className="gap-2 shrink-0"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} data-icon="inline-start" />
          Refresh Graph
        </Button>
      </div>

      {/* Control Bar: Search, Entity Filter, Confidence Threshold */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card border border-border p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Entity Type Filter */}
          <Select value={selectedType} onValueChange={(val) => setSelectedType(val || "all")}>
            <SelectTrigger className="w-[150px] bg-background">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entity Types</SelectItem>
              {ALL_ENTITY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {ENTITY_CONFIG[t].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Min Confidence Threshold */}
          <Select
            value={String(minConfidence)}
            onValueChange={(val) => setMinConfidence(Number(val || "0"))}
          >
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue placeholder="Min Confidence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">All Confidence</SelectItem>
              <SelectItem value="0.7">High (&ge; 70%)</SelectItem>
              <SelectItem value="0.85">Very High (&ge; 85%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Legend & Count */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-center gap-2">
          {activeLegendTypes.map((type) => {
            const cfg = ENTITY_CONFIG[type];
            const Ic = cfg.icon;
            return (
              <Badge
                key={type}
                variant="outline"
                className="gap-1.5 px-2.5 py-1"
                style={{ borderColor: `${cfg.color}44` }}
              >
                <Ic className="size-3" style={{ color: cfg.color }} />
                <span className="text-xs font-medium">{cfg.label}</span>
              </Badge>
            );
          })}
        </div>

        {graphData && (
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-2">
            <span>Showing {nodes.length} nodes</span>
            <span>&middot;</span>
            <span>{edges.length} relationships</span>
          </div>
        )}
      </div>

      {/* ReactFlow Graph Canvas */}
      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="p-0">
          <div className="h-[calc(100vh-310px)] min-h-[520px] relative">
            {error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center flex flex-col gap-2">
                  <p className="text-destructive font-semibold">{error}</p>
                  <p className="text-sm text-muted-foreground">
                    Ensure the FastAPI backend is running
                  </p>
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
                style={{ background: "oklch(0.12 0 0)" }}
              >
                <Background color="oklch(0.22 0 0)" gap={24} size={1} />
                <Controls
                  showInteractive={false}
                  className="!bg-card !border-border !rounded-lg !shadow-lg"
                />
                <MiniMap
                  nodeColor={(node) => {
                    const type = (node.data as { entityType?: string })
                      ?.entityType as EntityType;
                    const cfg = ENTITY_CONFIG[type];
                    return cfg?.color || "oklch(0.5 0 0)";
                  }}
                  maskColor="oklch(0.1 0 0 / 0.7)"
                  className="!bg-card !border-border !rounded-lg"
                />
              </ReactFlow>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Operational Memory Provenance Sheet (Side Drawer) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md p-6 overflow-y-auto flex flex-col gap-6">
          <SheetHeader className="p-0 gap-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-400 border-0 text-xs">
                <Sparkles className="size-3" />
                Operational Memory Provenance
              </Badge>
            </div>
            <SheetTitle className="text-xl font-bold tracking-tight">
              {selectedNodeData ? selectedNodeData.label : selectedEdgeData?.label || "Memory Provenance"}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              {selectedNodeData
                ? `Entity type: ${selectedNodeData.entityType}`
                : "Relationship evidence trace"}
            </SheetDescription>
          </SheetHeader>

          {/* Node / Edge Summary Card */}
          {selectedNodeData && (
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Confidence Score</span>
                <Badge
                  variant="outline"
                  className="font-mono text-xs gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                >
                  <ShieldCheck className="size-3.5" />
                  {Math.round((selectedNodeData.confidence || 0.9) * 100)}%
                </Badge>
              </div>

              {selectedNodeData.evidence && (
                <div className="flex flex-col gap-1 text-xs">
                  <span className="font-semibold text-muted-foreground">Primary Fact Quote</span>
                  <p className="p-2.5 rounded-lg bg-background border border-border/60 text-foreground/90 italic font-sans">
                    &ldquo;{selectedNodeData.evidence}&rdquo;
                  </p>
                </div>
              )}

              <Button
                size="sm"
                onClick={() => {
                  setSheetOpen(false);
                  router.push(`/entities/${selectedNodeData.entityType}/${selectedNodeData.entityId}`);
                }}
                className="w-full gap-2 mt-1"
              >
                View Entity Page
                <ExternalLink className="size-3.5" data-icon="inline-end" />
              </Button>
            </div>
          )}

          {/* Evidence Records List */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              Source Documents & Evidence Trace ({evidenceList.length})
            </h3>

            {loadingEvidence ? (
              <div className="flex flex-col gap-3">
                <div className="h-16 rounded-xl bg-card animate-pulse" />
                <div className="h-16 rounded-xl bg-card animate-pulse" />
              </div>
            ) : evidenceList.length === 0 ? (
              <p className="text-xs text-muted-foreground p-4 text-center border border-dashed rounded-xl">
                No direct evidence records linked to this node.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {evidenceList.map((ev) => (
                  <div key={ev.id} className="flex flex-col gap-2 p-3.5 rounded-xl bg-card border border-border text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate max-w-[200px]" title={ev.source_name}>
                        {ev.source_name}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {Math.round(ev.confidence * 100)}%
                      </Badge>
                    </div>

                    <div className="flex gap-2 p-2.5 rounded-lg bg-background text-foreground/90 italic">
                      <Quote className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="line-clamp-4 leading-relaxed">&ldquo;{ev.evidence_text}&rdquo;</p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                      <span className="capitalize">Type: {ev.source_type}</span>
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

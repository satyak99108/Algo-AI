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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Maximize2 } from "lucide-react";
import { api } from "@/lib/api";
import { ENTITY_CONFIG, ALL_ENTITY_TYPES } from "@/lib/constants";
import type { EntityType, GraphResponse } from "@/types/entities";
import { useRouter } from "next/navigation";

// Custom entity node component
function EntityNode({ data }: NodeProps) {
  const entityType = data.entityType as EntityType;
  const config = ENTITY_CONFIG[entityType];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className="group cursor-pointer"
      style={{ minWidth: 140 }}
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-200 hover:scale-105"
        style={{
          background: config.bgColor,
          borderColor: config.borderColor,
          boxShadow: `0 0 12px ${config.bgColor}`,
        }}
      >
        <div
          className="flex items-center justify-center size-7 rounded-md"
          style={{ background: `${config.color}22` }}
        >
          <Icon className="size-3.5" style={{ color: config.color }} />
        </div>
        <div className="flex flex-col min-w-0">
          <span
            className="text-xs font-semibold truncate max-w-[120px]"
            style={{ color: config.color }}
          >
            {data.label as string}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {config.labelSingular}
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

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const fetchGraph = useCallback(() => {
    setLoading(true);
    api
      .getGraph()
      .then((data) => {
        setGraphData(data);

        // Convert to React Flow nodes
        const flowNodes: Node[] = data.nodes.map((n) => ({
          id: n.id,
          type: "entity",
          position: n.position || { x: 0, y: 0 },
          data: n.data,
        }));

        // Convert to React Flow edges
        const flowEdges: Edge[] = data.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label.replace("_", " "),
          type: "default",
          animated: true,
          style: { stroke: "oklch(0.45 0 0)", strokeWidth: 1.5 },
          labelStyle: {
            fontSize: 10,
            fill: "oklch(0.6 0 0)",
            fontWeight: 500,
          },
          labelBgStyle: {
            fill: "oklch(0.17 0 0)",
            fillOpacity: 0.9,
          },
          labelBgPadding: [4, 2] as [number, number],
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: "oklch(0.45 0 0)",
          },
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [setNodes, setEdges]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const { entityType, entityId } = node.data as {
        entityType: string;
        entityId: string;
      };
      router.push(`/entities/${entityType}/${entityId}`);
    },
    [router]
  );

  // Entity type legend
  const activeLegendTypes = useMemo(() => {
    if (!graphData) return [];
    const types = new Set(graphData.nodes.map((n) => n.data.entityType));
    return ALL_ENTITY_TYPES.filter((t) => types.has(t));
  }, [graphData]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Knowledge Graph
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Interactive visualization of entities and relationships
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchGraph}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw
            className={`size-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2">
        {activeLegendTypes.map((type) => {
          const cfg = ENTITY_CONFIG[type];
          const Ic = cfg.icon;
          return (
            <Badge
              key={type}
              variant="outline"
              className="gap-1.5 px-2.5 py-1"
            >
              <Ic className="size-3" style={{ color: cfg.color }} />
              <span className="text-xs">{cfg.label}</span>
            </Badge>
          );
        })}
        {graphData && (
          <span className="text-xs text-muted-foreground ml-2">
            {graphData.nodes.length} nodes · {graphData.edges.length} edges
          </span>
        )}
      </div>

      {/* Graph Canvas */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[calc(100vh-280px)] min-h-[500px]">
            {error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <p className="text-destructive">{error}</p>
                  <p className="text-sm text-muted-foreground">
                    Make sure the backend is running
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
                nodeTypes={nodeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.3}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
                style={{ background: "oklch(0.12 0 0)" }}
              >
                <Background
                  color="oklch(0.22 0 0)"
                  gap={24}
                  size={1}
                />
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
    </div>
  );
}

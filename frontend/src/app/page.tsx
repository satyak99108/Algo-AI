"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Share2, TrendingUp, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { ALL_ENTITY_TYPES, ENTITY_CONFIG } from "@/lib/constants";
import type { StatsResponse } from "@/types/entities";

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your operational memory
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse-subtle">
              <CardHeader className="pb-2">
                <div className="h-4 w-20 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-12 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your operational memory
          </p>
        </div>
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-destructive font-medium">
                Unable to connect to the backend
              </p>
              <p className="text-sm text-muted-foreground">
                Make sure the FastAPI server is running at{" "}
                <code className="px-1.5 py-0.5 bg-muted rounded text-xs">
                  localhost:8000
                </code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your operational memory
          </p>
        </div>
        <Link
          href="/knowledge"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Share2 className="size-4" />
          View Knowledge Graph
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Entities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">
                {stats?.total_entities || 0}
              </span>
              <Badge variant="secondary">
                <TrendingUp className="size-3 mr-1" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Relationships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">
                {stats?.relationships || 0}
              </span>
              <Badge variant="secondary">
                <Share2 className="size-3 mr-1" />
                Connections
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Entity Type Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Entity Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ALL_ENTITY_TYPES.map((type, index) => {
            const config = ENTITY_CONFIG[type];
            const Icon = config.icon;
            const count = stats?.[type as keyof StatsResponse] || 0;

            return (
              <Link key={type} href={`/entities/${type}`}>
                <Card
                  className="group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {config.label}
                      </CardTitle>
                      <div
                        className="flex items-center justify-center size-8 rounded-md transition-transform group-hover:scale-110"
                        style={{
                          background: config.bgColor,
                          border: `1px solid ${config.borderColor}`,
                        }}
                      >
                        <Icon
                          className="size-4"
                          style={{ color: config.color }}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{count as number}</span>
                      <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

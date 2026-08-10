"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { ENTITY_CONFIG } from "@/lib/constants";
import { RelationshipForm } from "@/components/forms/relationship-form";
import type { EntityType, EntityDetailResponse, RelatedEntity } from "@/types/entities";

export default function EntityDetailPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const resolvedParams = use(params);
  const entityType = resolvedParams.type as EntityType;
  const entityId = resolvedParams.id;
  const config = ENTITY_CONFIG[entityType];

  const [detail, setDetail] = useState<EntityDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    api
      .getEntity(entityType, entityId)
      .then(setDetail)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [entityType, entityId]);

  if (!config) {
    return <div>Unknown entity type</div>;
  }

  const Icon = config.icon;

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-muted rounded animate-pulse-subtle" />
        <Card className="animate-pulse-subtle">
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded w-3/4" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Link
          href={`/entities/${entityType}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to {config.label}
        </Link>
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">{error || "Entity not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const entity = detail.entity;
  const relationships = detail.relationships;
  const entityName = (entity[config.nameField] as string) || "Unnamed";

  // Get display fields (exclude id, timestamps, and the name field)
  const displayFields = Object.entries(entity).filter(
    ([key]) =>
      !["id", "created_at", "updated_at", config.nameField].includes(key)
  );

  const outgoing = relationships.filter((r) => r.direction === "outgoing");
  const incoming = relationships.filter((r) => r.direction === "incoming");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back link */}
      <Link
        href={`/entities/${entityType}`}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to {config.label}
      </Link>

      {/* Entity Header */}
      <div className="flex items-start gap-4">
        <div
          className="flex items-center justify-center size-12 rounded-xl flex-shrink-0"
          style={{
            background: config.bgColor,
            border: `1px solid ${config.borderColor}`,
          }}
        >
          <Icon className="size-6" style={{ color: config.color }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{entityName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{config.labelSingular}</Badge>
            {typeof entity.status === "string" && (
              <Badge variant="secondary">
                {String(entity.status).replace("_", " ")}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="relationships">
            Relationships ({relationships.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayFields.map(([key, value]) => {
                  if (value === null || value === undefined) return null;

                  let displayValue = String(value);

                  // Format dates
                  if (
                    key.includes("date") ||
                    key.includes("_at") ||
                    key === "made_at" ||
                    key === "occurred_at"
                  ) {
                    try {
                      displayValue = new Date(
                        value as string
                      ).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });
                    } catch {
                      // keep original
                    }
                  }

                  // Format arrays
                  if (Array.isArray(value)) {
                    return (
                      <div key={key} className="col-span-full space-y-2">
                        <label className="text-sm font-medium text-muted-foreground capitalize">
                          {key.replace(/_/g, " ")}
                        </label>
                        <div className="space-y-1">
                          {(value as Array<Record<string, unknown>>).map(
                            (step, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-3 text-sm p-2 rounded-md bg-muted/50"
                              >
                                <span className="text-muted-foreground font-mono text-xs">
                                  {(step.order as number) || i + 1}
                                </span>
                                <span>
                                  {(step.label as string) ||
                                    (step.name as string) ||
                                    JSON.stringify(step)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Long text
                  if (displayValue.length > 100) {
                    return (
                      <div key={key} className="col-span-full space-y-1">
                        <label className="text-sm font-medium text-muted-foreground capitalize">
                          {key.replace(/_/g, " ")}
                        </label>
                        <p className="text-sm whitespace-pre-wrap">
                          {displayValue}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground capitalize">
                        {key.replace(/_/g, " ")}
                      </label>
                      <p className="text-sm">{displayValue}</p>
                    </div>
                  );
                })}
              </div>

              <Separator className="my-4" />

              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <span>
                  Created:{" "}
                  {new Date(entity.created_at as string).toLocaleString(
                    "en-IN"
                  )}
                </span>
                <span>
                  Updated:{" "}
                  {new Date(entity.updated_at as string).toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relationships" className="mt-4 space-y-4">
          <div className="flex justify-end mb-4">
            <RelationshipForm
              sourceType={entityType}
              sourceId={entityId}
              sourceName={entityName}
              onSuccess={fetchData}
            />
          </div>

          {relationships.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No relationships found
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Outgoing */}
              {outgoing.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ArrowUpRight className="size-4 text-primary" />
                      Outgoing Relationships ({outgoing.length})
                    </CardTitle>
                    <CardDescription>
                      Connections from {entityName} to other entities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {outgoing.map((rel, i) => (
                        <RelationshipRow key={i} rel={rel} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Incoming */}
              {incoming.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ArrowDownLeft className="size-4 text-muted-foreground" />
                      Incoming Relationships ({incoming.length})
                    </CardTitle>
                    <CardDescription>
                      Connections from other entities to {entityName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {incoming.map((rel, i) => (
                        <RelationshipRow key={i} rel={rel} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Link to Knowledge Graph */}
          <div className="flex justify-center">
            <Link href="/knowledge">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="size-4" />
                View in Knowledge Graph
              </Button>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RelationshipRow({ rel }: { rel: RelatedEntity }) {
  const targetConfig = ENTITY_CONFIG[rel.entity_type as EntityType];
  if (!targetConfig) return null;

  const TargetIcon = targetConfig.icon;

  return (
    <Link
      href={`/entities/${rel.entity_type}/${rel.id}`}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
    >
      <div
        className="flex items-center justify-center size-8 rounded-md flex-shrink-0"
        style={{
          background: targetConfig.bgColor,
          border: `1px solid ${targetConfig.borderColor}`,
        }}
      >
        <TargetIcon
          className="size-4"
          style={{ color: targetConfig.color }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{rel.name}</p>
        <p className="text-xs text-muted-foreground">
          {targetConfig.labelSingular}
        </p>
      </div>
      <Badge variant="outline" className="text-xs flex-shrink-0">
        {rel.relationship_type.replace("_", " ")}
      </Badge>
      <ArrowUpRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </Link>
  );
}

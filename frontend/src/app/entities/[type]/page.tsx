"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { api } from "@/lib/api";
import { ENTITY_CONFIG } from "@/lib/constants";
import { EntityForm } from "@/components/forms/entity-form";
import type { EntityType, PaginatedResponse } from "@/types/entities";

export default function EntityListPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const resolvedParams = use(params);
  const entityType = resolvedParams.type as EntityType;
  const config = ENTITY_CONFIG[entityType];

  const [data, setData] = useState<PaginatedResponse<Record<string, unknown>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api
      .listEntities(entityType, { page, search: search || undefined, page_size: 15 })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [entityType, page, search]);

  if (!config) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold">Unknown entity type: {entityType}</h1>
      </div>
    );
  }

  const Icon = config.icon;
  const nameField = config.nameField;

  // Get column headers based on entity type
  const getColumns = () => {
    switch (entityType) {
      case "people":
        return ["Name", "Role", "Department", "Status"];
      case "projects":
        return ["Name", "Status", "Start Date", "End Date"];
      case "decisions":
        return ["Title", "Impact", "Made At"];
      case "tasks":
        return ["Title", "Status", "Priority", "Due Date"];
      case "processes":
        return ["Name", "Steps"];
      case "events":
        return ["Title", "Type", "Occurred At"];
      case "documents":
        return ["Title", "Type", "Source"];
      case "workflows":
        return ["Name", "Trigger", "Steps"];
      default:
        return ["Name"];
    }
  };

  const getCellValue = (item: Record<string, unknown>, col: string) => {
    const map: Record<string, string> = {
      Name: nameField,
      Title: "title",
      Role: "role",
      Department: "department",
      Status: "status",
      "Start Date": "start_date",
      "End Date": "end_date",
      Impact: "impact",
      "Made At": "made_at",
      Priority: "priority",
      "Due Date": "due_date",
      Steps: "steps",
      Type: entityType === "documents" ? "doc_type" : "event_type",
      Source: "source",
      Trigger: "trigger",
      "Occurred At": "occurred_at",
    };

    const key = map[col];
    if (!key) return "—";

    const value = item[key];
    if (value === null || value === undefined) return "—";

    // Format dates
    if (col.includes("Date") || col.includes("At")) {
      try {
        return new Date(value as string).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch {
        return String(value);
      }
    }

    // Format arrays (steps)
    if (Array.isArray(value)) {
      return `${value.length} steps`;
    }

    return String(value);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
      case "completed":
        return "default" as const;
      case "in_progress":
        return "secondary" as const;
      case "pending":
        return "outline" as const;
      case "cancelled":
      case "archived":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const columns = getColumns();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center size-10 rounded-lg"
            style={{
              background: config.bgColor,
              border: `1px solid ${config.borderColor}`,
            }}
          >
            <Icon className="size-5" style={{ color: config.color }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {config.label}
            </h1>
            <p className="text-sm text-muted-foreground">
              {data?.total || 0} total {config.label.toLowerCase()}
            </p>
          </div>
        </div>
        <EntityForm entityType={entityType} onSuccess={() => {
          setPage(1);
          // Trigger a re-fetch by tricking effect
          setSearch(s => s + " "); setTimeout(() => setSearch(s => s.trim()), 0);
        }} />
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${config.label.toLowerCase()}...`}
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Make sure the backend is running
              </p>
            </div>
          ) : data?.items.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No {config.label.toLowerCase()} found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((item) => (
                  <TableRow
                    key={item.id as string}
                    className="group cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    {columns.map((col) => (
                      <TableCell key={col}>
                        {col === "Status" || col === "Priority" ? (
                          <Badge
                            variant={getStatusVariant(
                              getCellValue(item, col)
                            )}
                          >
                            {getCellValue(item, col).replace("_", " ")}
                          </Badge>
                        ) : col === "Impact" ? (
                          <Badge variant="outline">
                            {getCellValue(item, col)}
                          </Badge>
                        ) : (
                          <span
                            className={
                              col === "Name" || col === "Title"
                                ? "font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            {getCellValue(item, col)}
                          </span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Link
                        href={`/entities/${entityType}/${item.id}`}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="size-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {data.total_pages} ({data.total} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((p) => Math.min(data.total_pages, p + 1))
              }
              disabled={page >= data.total_pages}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

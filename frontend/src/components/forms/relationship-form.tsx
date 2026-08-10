"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Share2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { RELATIONSHIP_TYPES, ALL_ENTITY_TYPES, ENTITY_CONFIG } from "@/lib/constants";
import type { EntityType } from "@/types/entities";

interface RelationshipFormProps {
  sourceType: EntityType;
  sourceId: string;
  sourceName: string;
  onSuccess?: () => void;
}

export function RelationshipForm({ sourceType, sourceId, sourceName, onSuccess }: RelationshipFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingTargets, setFetchingTargets] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [relType, setRelType] = useState<string>("");
  const [targetType, setTargetType] = useState<EntityType | "">("");
  const [targetId, setTargetId] = useState<string>("");

  const [availableTargets, setAvailableTargets] = useState<Array<{id: string, name: string}>>([]);

  // Fetch entities when targetType changes
  useEffect(() => {
    if (!targetType) {
      setAvailableTargets([]);
      setTargetId("");
      return;
    }

    const fetchTargets = async () => {
      setFetchingTargets(true);
      try {
        const response = await api.listEntities(targetType, { page_size: 100 });
        const config = ENTITY_CONFIG[targetType];
        
        const options = response.items.map(item => ({
          id: item.id as string,
          name: String(item[config.nameField] || "Unnamed"),
        }));
        setAvailableTargets(options);
      } catch (err) {
        console.error("Failed to load targets", err);
      } finally {
        setFetchingTargets(false);
      }
    };

    fetchTargets();
  }, [targetType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relType || !targetType || !targetId) return;

    setLoading(true);
    setError(null);

    try {
      await api.createRelationship({
        source_type: sourceType,
        source_id: sourceId,
        relationship_type: relType,
        target_type: targetType,
        target_id: targetId,
      });
      
      setOpen(false);
      setRelType("");
      setTargetType("");
      setTargetId("");
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to create relationship");
    } finally {
      setLoading(false);
    }
  };

  const sourceConfig = ENTITY_CONFIG[sourceType];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="size-4" />
          Add Connection
        </Button>
      } />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="size-5 text-primary" />
            Add Relationship
          </DialogTitle>
          <DialogDescription>
            Connect <span className="font-semibold text-foreground">{sourceName}</span> to another entity in the knowledge graph.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center justify-center gap-2 py-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border text-sm">
              <sourceConfig.icon className="size-4" style={{ color: sourceConfig.color }} />
              <span className="max-w-[100px] truncate">{sourceName}</span>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Relationship Type</Label>
              <Select value={relType} onValueChange={(val) => setRelType(val || "")} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select how they are connected..." />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target Entity Type</Label>
              <Select value={targetType} onValueChange={(val) => setTargetType(val as EntityType)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select entity type..." />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ENTITY_TYPES.map(type => {
                    const cfg = ENTITY_CONFIG[type];
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <cfg.icon className="size-4" style={{ color: cfg.color }} />
                          {cfg.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Specific Target</Label>
              <Select 
                value={targetId} 
                onValueChange={(val) => setTargetId(val || "")} 
                required 
                disabled={!targetType || fetchingTargets}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    fetchingTargets ? "Loading..." : 
                    !targetType ? "Select a type first" : 
                    "Select specific target..."
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableTargets.length === 0 ? (
                    <SelectItem value="none" disabled>No entities found</SelectItem>
                  ) : (
                    availableTargets.map(target => (
                      <SelectItem key={target.id} value={target.id}>
                        {target.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !targetId || targetId === "none"}>
              {loading ? "Connecting..." : "Connect Entities"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { ENTITY_CONFIG } from "@/lib/constants";
import type { EntityType } from "@/types/entities";

interface EntityFormProps {
  entityType: EntityType;
  onSuccess?: () => void;
}

export function EntityForm({ entityType, onSuccess }: EntityFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = ENTITY_CONFIG[entityType];
  const Icon = config.icon;

  // Simple dynamic state for all form fields
  const [formData, setFormData] = useState<Record<string, string>>({
    status: "active", // default status
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.createEntity(entityType, formData);
      setOpen(false);
      setFormData({ status: "active" });
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to create entity");
    } finally {
      setLoading(false);
    }
  };

  // Helper to render an input field (called as a normal function to avoid losing focus)
  const renderField = (name: string, label: string, type = "text", required = false) => (
    <div className="space-y-2" key={name}>
      <Label htmlFor={name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        required={required}
        value={formData[name] || ""}
        onChange={(e) => handleChange(name, e.target.value)}
        className="bg-background"
      />
    </div>
  );

  const renderStatusField = () => (
    <div className="space-y-2" key="status">
      <Label>Status</Label>
      <Select
        value={formData.status || "active"}
        onValueChange={(val) => handleChange("status", val || "active")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  // Render fields based on entity type
  const renderFields = () => {
    switch (entityType) {
      case "people":
        return (
          <>
            {renderField("name", "Full Name", "text", true)}
            {renderField("role", "Role / Title")}
            {renderField("department", "Department")}
            {renderField("email", "Email Address", "email")}
            {renderStatusField()}
          </>
        );
      case "projects":
        return (
          <>
            {renderField("name", "Project Name", "text", true)}
            {renderField("description", "Description")}
            {renderField("start_date", "Start Date", "date")}
            {renderField("end_date", "End Date", "date")}
            {renderStatusField()}
          </>
        );
      case "decisions":
        return (
          <>
            {renderField("title", "Decision Title", "text", true)}
            {renderField("description", "Description")}
            {renderField("rationale", "Rationale")}
            <div className="space-y-2">
              <Label>Impact Level</Label>
              <Select
                value={formData.impact || ""}
                onValueChange={(val) => handleChange("impact", val || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select impact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {renderField("made_at", "Date Made", "date")}
          </>
        );
      case "tasks":
        return (
          <>
            {renderField("title", "Task Title", "text", true)}
            {renderField("description", "Description")}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority || "medium"}
                onValueChange={(val) => handleChange("priority", val || "medium")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status || "pending"}
                onValueChange={(val) => handleChange("status", val || "pending")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {renderField("due_date", "Due Date", "date")}
          </>
        );
      case "events":
        return (
          <>
            {renderField("title", "Event Title", "text", true)}
            {renderField("description", "Description")}
            {renderField("event_type", "Event Type (e.g. launch, meeting)")}
            {renderField("occurred_at", "Date Occurred", "date")}
          </>
        );
      case "processes":
      case "workflows":
        return (
          <>
            {renderField("name", "Name", "text", true)}
            {renderField("description", "Description")}
            {entityType === "workflows" && renderField("trigger", "Workflow Trigger")}
            <p className="text-xs text-muted-foreground mt-2">
              Note: Steps can be added later via the API.
            </p>
          </>
        );
      case "documents":
        return (
          <>
            {renderField("title", "Document Title", "text", true)}
            {renderField("content", "Content / Summary")}
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select
                value={formData.doc_type || "txt"}
                onValueChange={(val) => handleChange("doc_type", val || "txt")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">Word (DOCX)</SelectItem>
                  <SelectItem value="txt">Text</SelectItem>
                  <SelectItem value="md">Markdown</SelectItem>
                  <SelectItem value="slack">Slack Export</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {renderField("source", "Source System")}
          </>
        );
      default:
        return renderField("name", "Name", "text", true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="gap-2" style={{ backgroundColor: config.color, color: "#fff" }}>
          <Plus className="size-4" />
          Add {config.labelSingular}
        </Button>
      } />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="size-5" style={{ color: config.color }} />
            Create {config.labelSingular}
          </DialogTitle>
          <DialogDescription>
            Add a new {config.labelSingular.toLowerCase()} to the knowledge graph.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {renderFields()}
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
            <Button type="submit" disabled={loading} style={{ backgroundColor: config.color, color: "#fff" }}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

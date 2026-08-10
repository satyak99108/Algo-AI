import {
  Users,
  FolderKanban,
  Scale,
  CheckSquare,
  Workflow,
  CalendarDays,
  FileText,
  GitBranch,
  type LucideIcon,
} from "lucide-react";
import type { EntityType } from "@/types/entities";

interface EntityConfig {
  label: string;
  labelSingular: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  nameField: string;
}

export const ENTITY_CONFIG: Record<EntityType, EntityConfig> = {
  people: {
    label: "People",
    labelSingular: "Person",
    icon: Users,
    color: "var(--entity-people)",
    bgColor: "oklch(0.65 0.15 270 / 0.12)",
    borderColor: "oklch(0.65 0.15 270 / 0.3)",
    nameField: "name",
  },
  projects: {
    label: "Projects",
    labelSingular: "Project",
    icon: FolderKanban,
    color: "var(--entity-projects)",
    bgColor: "oklch(0.65 0.17 160 / 0.12)",
    borderColor: "oklch(0.65 0.17 160 / 0.3)",
    nameField: "name",
  },
  decisions: {
    label: "Decisions",
    labelSingular: "Decision",
    icon: Scale,
    color: "var(--entity-decisions)",
    bgColor: "oklch(0.72 0.15 60 / 0.12)",
    borderColor: "oklch(0.72 0.15 60 / 0.3)",
    nameField: "title",
  },
  tasks: {
    label: "Tasks",
    labelSingular: "Task",
    icon: CheckSquare,
    color: "var(--entity-tasks)",
    bgColor: "oklch(0.65 0.15 220 / 0.12)",
    borderColor: "oklch(0.65 0.15 220 / 0.3)",
    nameField: "title",
  },
  processes: {
    label: "Processes",
    labelSingular: "Process",
    icon: GitBranch,
    color: "var(--entity-processes)",
    bgColor: "oklch(0.62 0.18 290 / 0.12)",
    borderColor: "oklch(0.62 0.18 290 / 0.3)",
    nameField: "name",
  },
  events: {
    label: "Events",
    labelSingular: "Event",
    icon: CalendarDays,
    color: "var(--entity-events)",
    bgColor: "oklch(0.65 0.18 15 / 0.12)",
    borderColor: "oklch(0.65 0.18 15 / 0.3)",
    nameField: "title",
  },
  documents: {
    label: "Documents",
    labelSingular: "Document",
    icon: FileText,
    color: "var(--entity-documents)",
    bgColor: "oklch(0.55 0.04 250 / 0.12)",
    borderColor: "oklch(0.55 0.04 250 / 0.3)",
    nameField: "title",
  },
  workflows: {
    label: "Workflows",
    labelSingular: "Workflow",
    icon: Workflow,
    color: "var(--entity-workflows)",
    bgColor: "oklch(0.65 0.14 180 / 0.12)",
    borderColor: "oklch(0.65 0.14 180 / 0.3)",
    nameField: "name",
  },
};

export const ALL_ENTITY_TYPES: EntityType[] = [
  "people",
  "projects",
  "decisions",
  "tasks",
  "processes",
  "events",
  "documents",
  "workflows",
];

export const RELATIONSHIP_TYPES = [
  "owns",
  "made",
  "affects",
  "triggers",
  "creates",
  "assigned_to",
  "depends_on",
  "related_to",
  "part_of",
  "follows",
];

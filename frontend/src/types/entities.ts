export interface EntityBase {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface Person extends EntityBase {
  name: string;
  role: string | null;
  department: string | null;
  email: string | null;
  status: string;
}

export interface Project extends EntityBase {
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
}

export interface Decision extends EntityBase {
  title: string;
  description: string | null;
  rationale: string | null;
  made_at: string | null;
  impact: string | null;
}

export interface Task extends EntityBase {
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
}

export interface Process extends EntityBase {
  name: string;
  description: string | null;
  steps: Array<{ order: number; name: string; description: string }> | null;
}

export interface Event extends EntityBase {
  title: string;
  description: string | null;
  event_type: string | null;
  occurred_at: string | null;
}

export interface Document extends EntityBase {
  title: string;
  content: string | null;
  doc_type: string;
  source: string | null;
  file_path: string | null;
}

export interface Workflow extends EntityBase {
  name: string;
  description: string | null;
  trigger: string | null;
  steps: Array<{ order: number; action: string; label: string }> | null;
}

export type AnyEntity = Person | Project | Decision | Task | Process | Event | Document | Workflow;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface StatsResponse {
  people: number;
  projects: number;
  decisions: number;
  tasks: number;
  processes: number;
  events: number;
  documents: number;
  workflows: number;
  relationships: number;
  total_entities: number;
}

export interface RelatedEntity {
  id: string;
  entity_type: string;
  name: string;
  relationship_type: string;
  direction: "outgoing" | "incoming";
}

export interface EntityDetailResponse {
  entity: Record<string, unknown>;
  entity_type: string;
  relationships: RelatedEntity[];
}

export interface RelationshipData {
  id: string;
  source_type: string;
  source_id: string;
  relationship_type: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  source_name: string | null;
  target_name: string | null;
}

export interface GraphNode {
  id: string;
  type: string;
  data: {
    label: string;
    entityType: string;
    entityId: string;
    isFocal?: boolean;
    confidence?: number;
    evidence?: string | null;
    evidenceCount?: number;
  };
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  data?: {
    relationshipType?: string;
    confidence?: number;
    evidence?: string | null;
  };
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type EntityType = "people" | "projects" | "decisions" | "tasks" | "processes" | "events" | "documents" | "workflows";

export interface EvidenceRecord {
  id: string;
  source_id: string;
  source_name: string;
  source_type: string;
  confidence: number;
  evidence_text: string;
  created_at: string;
}

export interface MemoryItem {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  relationship: {
    id: string;
    source_type: string;
    source_name: string;
    relationship_type: string;
    target_type: string;
    target_name: string;
  } | null;
  confidence: number;
  evidence_text: string | null;
  source_id: string;
  source_name: string;
  source_type: string;
  created_at: string;
}

export interface MemorySearchResponse {
  items: MemoryItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface MemoryTimelineItem {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  confidence: number;
  evidence_text: string | null;
  source_name: string;
  source_type: string;
  timestamp: string;
}

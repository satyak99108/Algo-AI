const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    throw new ApiError(
      errorData?.message || `API Error: ${response.status}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

// --- Entity endpoints ---

export const api = {
  // Stats
  getStats: () => request<import("@/types/entities").StatsResponse>("/stats"),

  // Entities
  listEntities: (
    type: string,
    params?: {
      page?: number;
      page_size?: number;
      search?: string;
      sort_by?: string;
      sort_order?: string;
    }
  ) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size) searchParams.set("page_size", String(params.page_size));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
    if (params?.sort_order) searchParams.set("sort_order", params.sort_order);
    const qs = searchParams.toString();
    return request<import("@/types/entities").PaginatedResponse<Record<string, unknown>>>(
      `/entities/${type}${qs ? `?${qs}` : ""}`
    );
  },

  getEntity: (type: string, id: string) =>
    request<import("@/types/entities").EntityDetailResponse>(
      `/entities/${type}/${id}`
    ),

  createEntity: (type: string, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/entities/${type}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateEntity: (type: string, id: string, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/entities/${type}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteEntity: (type: string, id: string) =>
    request<{ message: string }>(`/entities/${type}/${id}`, {
      method: "DELETE",
    }),

  // Relationships
  listRelationships: (params?: Record<string, string>) => {
    const searchParams = new URLSearchParams(params);
    const qs = searchParams.toString();
    return request<import("@/types/entities").RelationshipData[]>(
      `/relationships${qs ? `?${qs}` : ""}`
    );
  },

  createRelationship: (data: {
    source_type: string;
    source_id: string;
    relationship_type: string;
    target_type: string;
    target_id: string;
  }) =>
    request<import("@/types/entities").RelationshipData>("/relationships", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteRelationship: (id: string) =>
    request<{ message: string }>(`/relationships/${id}`, {
      method: "DELETE",
    }),

  // Graph
  getGraph: () =>
    request<import("@/types/entities").GraphResponse>("/graph"),

  getNeighbors: (type: string, id: string) =>
    request<import("@/types/entities").GraphResponse>(
      `/graph/neighbors/${type}/${id}`
    ),

  // Seed
  seed: () =>
    request<{ message: string }>("/seed", { method: "POST" }),

  // Ingestion
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<any>("/ingest/upload", {
      method: "POST",
      body: formData,
    });
  },

  ingestText: (text: string, label?: string) =>
    request<any>("/ingest/text", {
      method: "POST",
      body: JSON.stringify({ text, label }),
    }),

  listSources: (page: number = 1, page_size: number = 20) =>
    request<any>(`/ingest/sources?page=${page}&page_size=${page_size}`),

  getSourceDetail: (id: string) =>
    request<any>(`/ingest/sources/${id}`),

  getAiStatus: () =>
    request<any>("/ingest/status"),
};

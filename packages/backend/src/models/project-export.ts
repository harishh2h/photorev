export const PROJECT_EXPORTS_TABLE = "project_exports";

export type ProjectExportVariant = "original" | "preview";

export type ProjectExportStatus = "queued" | "processing" | "done" | "failed" | "expired";

export const EXPORT_TTL_MS = 6 * 60 * 60 * 1000;

export interface ProjectExportRecord {
  readonly id: string;
  readonly project_id: string;
  readonly share_link_id: string | null;
  readonly created_by_user_id: string | null;
  readonly variant: ProjectExportVariant;
  readonly status: ProjectExportStatus;
  readonly photo_count: number;
  readonly processed_count: number;
  readonly file_path: string | null;
  readonly byte_size: string | number | null;
  readonly error_message: string | null;
  readonly expires_at: Date | null;
  readonly queued_at: Date;
  readonly started_at: Date | null;
  readonly completed_at: Date | null;
  readonly selection_hash: string | null;
  readonly review_scope: string | null;
  readonly photo_filter: string | null;
  readonly photo_ids: string[] | null;
}

export interface ProjectExportDto {
  readonly id: string;
  readonly projectId: string;
  readonly variant: ProjectExportVariant;
  readonly status: ProjectExportStatus;
  readonly photoCount: number;
  readonly processedCount: number;
  readonly progressPercent: number;
  readonly byteSize: number | null;
  readonly errorMessage: string | null;
  readonly expiresAt: string | null;
  readonly queuedAt: string;
  readonly completedAt: string | null;
  readonly downloadAvailable: boolean;
  /** True when an existing ZIP was returned (selection unchanged). */
  readonly reused: boolean;
}

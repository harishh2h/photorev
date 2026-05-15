import { randomUUID } from "crypto";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Knex } from "knex";
import {
  normalizeProjectRootPathForPersist,
  projectRootPathForApi,
} from "../utils/storage";
import { applyPagination, buildPaginatedResult, PaginatedResult, PaginationParams } from "../utils/pagination";
import {
  type CollaboratorRole,
  parseCollaboratorRole,
} from "../utils/project-permissions";

function isPersistableBannerUrl(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  if (!trimmed.length) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export type ProjectStatus = "active" | "processing" | "completed";

/**
 * JSON stored in `projects.metadata`.
 * `bannerPhotoId`: photo UUID; dashboard loads preview via `GET /photos/:id/content` (preview.* on disk).
 * `banner`: optional legacy cover image URL; only `http:` / `https:` allowed (validated on persist + stripped on API if invalid).
 */
export type ProjectMetadata = Readonly<
  { banner?: string; bannerPhotoId?: string } & Record<string, unknown>
>;

export interface ProjectRecord {
  readonly id: string;
  name: string;
  status: ProjectStatus;
  is_active: boolean;
  root_path: string;
  metadata: ProjectMetadata;
  readonly created_by: string;
  readonly created_at: Date;
}

export interface ProjectViewerContextDto {
  readonly isCreator: boolean;
  readonly role: CollaboratorRole;
  readonly owner: {
    readonly id: string;
    readonly name: string;
    readonly email: string;
  };
}

export interface ProjectDto {
  readonly id: string;
  readonly name: string;
  readonly status: ProjectStatus;
  readonly isActive: boolean;
  readonly rootPath: string;
  readonly metadata: ProjectMetadata;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly viewerContext: ProjectViewerContextDto;
}

export interface ListProjectsFilters extends PaginationParams {
  readonly status?: ProjectStatus;
  readonly isActive?: boolean;
}

export interface CreateProjectParams {
  readonly userId: string;
  readonly name: string;
  readonly rootPath?: string;
  readonly metadata?: ProjectMetadata;
}

export interface UpdateProjectParams {
  readonly userId: string;
  readonly projectId: string;
  readonly name?: string;
  readonly status?: ProjectStatus;
  readonly isActive?: boolean;
  readonly rootPath?: string;
  readonly metadata?: ProjectMetadata;
}

export interface ArchiveProjectParams {
  readonly userId: string;
  readonly projectId: string;
}

export interface DeleteProjectParams {
  readonly userId: string;
  readonly projectId: string;
}

export interface GetProjectParams {
  readonly userId: string;
  readonly projectId: string;
}

/** Result of picking an ephemeral dashboard cover photo (no metadata write). */
export type RandomCoverPhotoResult =
  | { readonly access: false }
  | { readonly access: true; readonly photoId: string | null };

export type ProjectMutationDeniedReason = "not_found" | "forbidden";

export type ProjectUpdateResult =
  | { readonly ok: true; readonly project: ProjectDto }
  | { readonly ok: false; readonly reason: ProjectMutationDeniedReason };

export type ProjectArchiveDeleteResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: ProjectMutationDeniedReason };

export interface ProjectsServiceMethods {
  listProjects: (filters: ListProjectsFilters, userId: string) => Promise<PaginatedResult<ProjectDto>>;
  createProject: (params: CreateProjectParams) => Promise<ProjectDto>;
  getProject: (params: GetProjectParams) => Promise<ProjectDto | null>;
  getRandomCoverPhotoId: (params: GetProjectParams) => Promise<RandomCoverPhotoResult>;
  updateProject: (params: UpdateProjectParams) => Promise<ProjectUpdateResult>;
  archiveProject: (params: ArchiveProjectParams) => Promise<ProjectArchiveDeleteResult>;
  deleteProject: (params: DeleteProjectParams) => Promise<ProjectArchiveDeleteResult>;
}

function parseProjectMetadata(value: unknown): ProjectMetadata {
  if (value == null) {
    return {};
  }
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as ProjectMetadata;
      }
      return {};
    } catch {
      return {};
    }
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as ProjectMetadata;
  }
  return {};
}

function sanitizeMetadataForApi(meta: ProjectMetadata): ProjectMetadata {
  const merged = { ...meta };
  if ("banner" in merged && typeof (merged as { banner?: unknown }).banner !== "undefined") {
    const bannerValue = merged.banner as unknown;
    if (!isPersistableBannerUrl(bannerValue)) {
      delete (merged as Record<string, unknown>).banner;
    }
  }
  return merged;
}

function normalizeMetadataForStorage(meta: ProjectMetadata): ProjectMetadata {
  const merged = { ...meta };
  if ("banner" in merged) {
    if (!isPersistableBannerUrl(merged.banner)) {
      delete (merged as Record<string, unknown>).banner;
    }
  }
  return merged;
}

type ProjectRowWithViewer = ProjectRecord & {
  readonly viewer_role: string;
  readonly owner_id: string;
  readonly owner_name: string;
  readonly owner_email: string;
};

function buildViewerContextDto(
  row: ProjectRecord,
  memberUserId: string,
  viewerRoleRaw: string,
  ownerId: string,
  ownerName: string,
  ownerEmail: string,
): ProjectViewerContextDto {
  return {
    isCreator: row.created_by === memberUserId,
    role: parseCollaboratorRole(viewerRoleRaw),
    owner: {
      id: ownerId,
      name: ownerName,
      email: ownerEmail,
    },
  };
}

function mapProjectRecordToDto(
  record: ProjectRecord,
  viewerContext: ProjectViewerContextDto,
): ProjectDto {
  const metadata = sanitizeMetadataForApi(parseProjectMetadata(record.metadata));
  return {
    id: record.id,
    name: record.name,
    status: record.status,
    isActive: record.is_active,
    rootPath: projectRootPathForApi(record.root_path, record.id),
    metadata,
    createdBy: record.created_by,
    createdAt: record.created_at.toISOString(),
    viewerContext,
  };
}

function buildProjectsService(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
): ProjectsServiceMethods {
  const db: Knex = fastify.db;

  async function gateCreatorOnlyProjectMutation(
    userId: string,
    projectId: string,
  ): Promise<ProjectMutationDeniedReason | null> {
    const project = await db<ProjectRecord>("projects").where({ id: projectId }).first();
    if (!project) {
      return "not_found";
    }
    const member = await db("project_members")
      .where({
        project_id: projectId,
        user_id: userId,
      })
      .first();
    if (!member) {
      return "not_found";
    }
    if (project.created_by !== userId) {
      return "forbidden";
    }
    return null;
  }

  async function listProjects(
    filters: ListProjectsFilters,
    userId: string,
  ): Promise<PaginatedResult<ProjectDto>> {
    const baseQuery = db<ProjectRowWithViewer>("projects")
      .select(
        "projects.*",
        "project_members.role as viewer_role",
        "owner.id as owner_id",
        "owner.name as owner_name",
        "owner.email as owner_email",
      )
      .join("project_members", function joinProjectMembers() {
        this.on("project_members.project_id", "projects.id").andOn(
          "project_members.user_id",
          db.raw("?", [userId]),
        );
      })
      .join({ owner: "users" }, "owner.id", "projects.created_by");
    if (typeof filters.status !== "undefined") {
      baseQuery.where("projects.status", filters.status);
    }
    if (typeof filters.isActive !== "undefined") {
      baseQuery.where("projects.is_active", filters.isActive);
    }
    const countResult = await baseQuery
      .clone()
      .clearSelect()
      .count<{ count: string }[]>({ count: "*" });
    const total = Number(countResult[0]?.count ?? 0);
    const rows = (await applyPagination(baseQuery, filters)) as ProjectRowWithViewer[];
    const items = rows.map((row) => {
      const ctx = buildViewerContextDto(row, userId, row.viewer_role, row.owner_id, row.owner_name, row.owner_email);
      return mapProjectRecordToDto(row, ctx);
    });
    return buildPaginatedResult(items, total, filters.page, filters.pageSize);
  }

  async function createProject(params: CreateProjectParams): Promise<ProjectDto> {
    const result = await db.transaction(async (trx: Knex.Transaction) => {
      const projectId = randomUUID();
      const rootPath = normalizeProjectRootPathForPersist(params.rootPath, projectId);
      const metadataPayload = normalizeMetadataForStorage(params.metadata ?? {});
      const insertedProjects = await trx<ProjectRecord>("projects")
        .insert(
          {
            id: projectId,
            name: params.name,
            root_path: rootPath,
            metadata: metadataPayload,
            created_by: params.userId,
          },
          "*",
        )
        .then((rows: ProjectRecord[]) => rows);
      const project = insertedProjects[0];
      await trx("project_members").insert({
        project_id: project.id,
        user_id: params.userId,
        is_owner: true,
        role: "contributor",
      });
      return project;
    });
    const ownerRow = await db<{ name: string; email: string }>("users")
      .select("name", "email")
      .where("id", params.userId)
      .first();
    const viewerContext = buildViewerContextDto(
      result,
      params.userId,
      "contributor",
      params.userId,
      ownerRow?.name ?? "",
      ownerRow?.email ?? "",
    );
    return mapProjectRecordToDto(result, viewerContext);
  }

  async function getProject(params: GetProjectParams): Promise<ProjectDto | null> {
    const row = await db<ProjectRowWithViewer>("projects")
      .select(
        "projects.*",
        "project_members.role as viewer_role",
        "owner.id as owner_id",
        "owner.name as owner_name",
        "owner.email as owner_email",
      )
      .join("project_members", function joinProjectMembers() {
        this.on("project_members.project_id", "projects.id").andOn(
          "project_members.user_id",
          db.raw("?", [params.userId]),
        );
      })
      .join({ owner: "users" }, "owner.id", "projects.created_by")
      .where("projects.id", params.projectId)
      .first();
    if (!row) {
      return null;
    }
    const viewerContext = buildViewerContextDto(
      row,
      params.userId,
      row.viewer_role,
      row.owner_id,
      row.owner_name,
      row.owner_email,
    );
    return mapProjectRecordToDto(row, viewerContext);
  }

  async function getRandomCoverPhotoId(params: GetProjectParams): Promise<RandomCoverPhotoResult> {
    const member = await db("project_members")
      .where({
        project_id: params.projectId,
        user_id: params.userId,
      })
      .first();
    if (!member) {
      return { access: false };
    }
    const row = await db<{ id: string }>("photos")
      .select("photos.id")
      .where("photos.project_id", params.projectId)
      .where("photos.status", "ready")
      .whereNotNull("photos.preview_path")
      .orderByRaw("random()")
      .first();
    return { access: true, photoId: row?.id ?? null };
  }

  async function updateProject(params: UpdateProjectParams): Promise<ProjectUpdateResult> {
    const deny = await gateCreatorOnlyProjectMutation(params.userId, params.projectId);
    if (deny === "not_found") {
      return { ok: false, reason: "not_found" };
    }
    if (deny === "forbidden") {
      return { ok: false, reason: "forbidden" };
    }
    const existing = await db<ProjectRecord>("projects").where({ id: params.projectId }).first();
    if (!existing) {
      return { ok: false, reason: "not_found" };
    }
    const patch: Partial<ProjectRecord> = {};
    if (typeof params.name !== "undefined") {
      patch.name = params.name;
    }
    if (typeof params.status !== "undefined") {
      patch.status = params.status;
    }
    if (typeof params.isActive !== "undefined") {
      patch.is_active = params.isActive;
    }
    if (typeof params.rootPath !== "undefined") {
      patch.root_path = normalizeProjectRootPathForPersist(params.rootPath, params.projectId);
    }
    if (typeof params.metadata !== "undefined") {
      patch.metadata = normalizeMetadataForStorage({
        ...parseProjectMetadata(existing.metadata),
        ...params.metadata,
      });
    }
    if (Object.keys(patch).length === 0) {
      const got = await getProject({
        userId: params.userId,
        projectId: params.projectId,
      });
      if (!got) {
        return { ok: false, reason: "not_found" };
      }
      return { ok: true, project: got };
    }
    const updatedRows = (await db<ProjectRecord>("projects")
      .where("id", params.projectId)
      .update(patch, "*")
      .then((rows: ProjectRecord[]) => rows)) as ProjectRecord[];
    const updated = updatedRows[0];
    if (!updated) {
      return { ok: false, reason: "not_found" };
    }
    const got = await getProject({
      userId: params.userId,
      projectId: params.projectId,
    });
    if (!got) {
      return { ok: false, reason: "not_found" };
    }
    return { ok: true, project: got };
  }

  async function archiveProject(params: ArchiveProjectParams): Promise<ProjectArchiveDeleteResult> {
    const deny = await gateCreatorOnlyProjectMutation(params.userId, params.projectId);
    if (deny === "not_found") {
      return { ok: false, reason: "not_found" };
    }
    if (deny === "forbidden") {
      return { ok: false, reason: "forbidden" };
    }
    const updatedCount = await db<ProjectRecord>("projects")
      .where("id", params.projectId)
      .update({
        is_active: false,
        status: "completed",
      });
    return updatedCount > 0 ? { ok: true } : { ok: false, reason: "not_found" };
  }

  async function deleteProject(params: DeleteProjectParams): Promise<ProjectArchiveDeleteResult> {
    const deny = await gateCreatorOnlyProjectMutation(params.userId, params.projectId);
    if (deny === "not_found") {
      return { ok: false, reason: "not_found" };
    }
    if (deny === "forbidden") {
      return { ok: false, reason: "forbidden" };
    }
    const deletedCount = await db<ProjectRecord>("projects")
      .where("id", params.projectId)
      .delete();
    return deletedCount > 0 ? { ok: true } : { ok: false, reason: "not_found" };
  }

  return {
    listProjects,
    createProject,
    getProject,
    getRandomCoverPhotoId,
    updateProject,
    archiveProject,
    deleteProject,
  };
}

export default buildProjectsService;


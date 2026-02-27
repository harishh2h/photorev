import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Knex } from "knex";
import { applyPagination, buildPaginatedResult, PaginatedResult, PaginationParams } from "../utils/pagination";

export type ProjectStatus = "active" | "processing" | "completed";

export interface ProjectRecord {
  readonly id: string;
  name: string;
  status: ProjectStatus;
  is_active: boolean;
  root_path: string;
  readonly created_by: string;
  readonly created_at: Date;
}

export interface ProjectDto {
  readonly id: string;
  readonly name: string;
  readonly status: ProjectStatus;
  readonly isActive: boolean;
  readonly rootPath: string;
  readonly createdBy: string;
  readonly createdAt: string;
}

export interface ListProjectsFilters extends PaginationParams {
  readonly status?: ProjectStatus;
  readonly isActive?: boolean;
}

export interface CreateProjectParams {
  readonly userId: string;
  readonly name: string;
  readonly rootPath: string;
}

export interface UpdateProjectParams {
  readonly userId: string;
  readonly projectId: string;
  readonly name?: string;
  readonly status?: ProjectStatus;
  readonly isActive?: boolean;
  readonly rootPath?: string;
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

export interface ProjectsServiceMethods {
  listProjects: (filters: ListProjectsFilters, userId: string) => Promise<PaginatedResult<ProjectDto>>;
  createProject: (params: CreateProjectParams) => Promise<ProjectDto>;
  getProject: (params: GetProjectParams) => Promise<ProjectDto | null>;
  updateProject: (params: UpdateProjectParams) => Promise<ProjectDto | null>;
  archiveProject: (params: ArchiveProjectParams) => Promise<boolean>;
  deleteProject: (params: DeleteProjectParams) => Promise<boolean>;
}

function mapProjectRecordToDto(record: ProjectRecord): ProjectDto {
  return {
    id: record.id,
    name: record.name,
    status: record.status,
    isActive: record.is_active,
    rootPath: record.root_path,
    createdBy: record.created_by,
    createdAt: record.created_at.toISOString(),
  };
}

function buildProjectsService(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
): ProjectsServiceMethods {
  const db: Knex = fastify.db;

  async function listProjects(
    filters: ListProjectsFilters,
    userId: string,
  ): Promise<PaginatedResult<ProjectDto>> {
    const baseQuery = db<ProjectRecord>("projects")
      .select<ProjectRecord[]>("projects.*")
      .join("project_members", function joinProjectMembers() {
        this.on("project_members.project_id", "projects.id").andOn(
          "project_members.user_id",
          db.raw("?", [userId]),
        );
      });
    if (typeof filters.status !== "undefined") {
      baseQuery.where("projects.status", filters.status);
    }
    if (typeof filters.isActive !== "undefined") {
      baseQuery.where("projects.is_active", filters.isActive);
    }
    const countResult = await baseQuery.clone().count<{ count: string }[]>({
      count: "*",
    });
    const total = Number(countResult[0]?.count ?? 0);
    const rows = (await applyPagination(baseQuery, filters)) as ProjectRecord[];
    const items = rows.map(mapProjectRecordToDto);
    return buildPaginatedResult(items, total, filters.page, filters.pageSize);
  }

  async function createProject(params: CreateProjectParams): Promise<ProjectDto> {
    const result = await db.transaction(async (trx: Knex.Transaction) => {
      const insertedProjects = await trx<ProjectRecord>("projects")
        .insert(
          {
            name: params.name,
            root_path: params.rootPath,
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
      });
      return project;
    });
    return mapProjectRecordToDto(result);
  }

  async function getProject(params: GetProjectParams): Promise<ProjectDto | null> {
    const row = await db<ProjectRecord>("projects")
      .select<ProjectRecord[]>("projects.*")
      .join("project_members", function joinProjectMembers() {
        this.on("project_members.project_id", "projects.id").andOn(
          "project_members.user_id",
          db.raw("?", [params.userId]),
        );
      })
      .where("projects.id", params.projectId)
      .first();
    if (!row) {
      return null;
    }
    return mapProjectRecordToDto(row);
  }

  async function updateProject(params: UpdateProjectParams): Promise<ProjectDto | null> {
    const isOwnerRow = await db("project_members")
      .where({
        project_id: params.projectId,
        user_id: params.userId,
        is_owner: true,
      })
      .first();
    if (!isOwnerRow) {
      return null;
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
      patch.root_path = params.rootPath;
    }
    if (Object.keys(patch).length === 0) {
      const existing = await db<ProjectRecord>("projects")
        .where("id", params.projectId)
        .first();
      if (!existing) {
        return null;
      }
      return mapProjectRecordToDto(existing);
    }
    const updatedRows = (await db<ProjectRecord>("projects")
      .where("id", params.projectId)
      .update(patch, "*")
      .then((rows: ProjectRecord[]) => rows)) as ProjectRecord[];
    const updated = updatedRows[0];
    if (!updated) {
      return null;
    }
    return mapProjectRecordToDto(updated);
  }

  async function archiveProject(params: ArchiveProjectParams): Promise<boolean> {
    const isOwnerRow = await db("project_members")
      .where({
        project_id: params.projectId,
        user_id: params.userId,
        is_owner: true,
      })
      .first();
    if (!isOwnerRow) {
      return false;
    }
    const updatedCount = await db<ProjectRecord>("projects")
      .where("id", params.projectId)
      .update({
        is_active: false,
        status: "completed",
      });
    return updatedCount > 0;
  }

  async function deleteProject(params: DeleteProjectParams): Promise<boolean> {
    const isOwnerRow = await db("project_members")
      .where({
        project_id: params.projectId,
        user_id: params.userId,
        is_owner: true,
      })
      .first();
    if (!isOwnerRow) {
      return false;
    }
    const deletedCount = await db<ProjectRecord>("projects")
      .where("id", params.projectId)
      .delete();
    return deletedCount > 0;
  }

  return {
    listProjects,
    createProject,
    getProject,
    updateProject,
    archiveProject,
    deleteProject,
  };
}

export default buildProjectsService;


import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Knex } from "knex";
import {
  applyPagination,
  buildPaginatedResult,
  PaginatedResult,
  PaginationParams,
} from "../utils/pagination";

export type LibraryStatus = "active" | "processing" | "completed";

export interface LibraryRecord {
  readonly id: string;
  name: string;
  description: string | null;
  readonly absolute_path: string;
  readonly project_id: string;
  status: LibraryStatus;
  is_active: boolean;
  readonly created_by: string;
  readonly created_at: Date;
}

export interface LibraryDto {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly absolutePath: string;
  readonly projectId: string;
  readonly status: LibraryStatus;
  readonly isActive: boolean;
  readonly createdBy: string;
  readonly createdAt: string;
}

export interface ListLibrariesFilters extends PaginationParams {
  readonly projectId?: string;
}

export interface CreateLibraryParams {
  readonly userId: string;
  readonly projectId: string;
  readonly name: string;
  readonly absolutePath: string;
  readonly description?: string;
}

export interface GetLibraryParams {
  readonly userId: string;
  readonly libraryId: string;
}

export interface UpdateLibraryParams {
  readonly userId: string;
  readonly libraryId: string;
  readonly name?: string;
  readonly description?: string | null;
  readonly status?: LibraryStatus;
  readonly isActive?: boolean;
}

export interface ArchiveLibraryParams {
  readonly userId: string;
  readonly libraryId: string;
}

export interface LibrariesServiceMethods {
  listLibraries: (
    filters: ListLibrariesFilters,
    userId: string,
  ) => Promise<PaginatedResult<LibraryDto>>;
  createLibrary: (params: CreateLibraryParams) => Promise<LibraryDto | null>;
  getLibrary: (params: GetLibraryParams) => Promise<LibraryDto | null>;
  updateLibrary: (params: UpdateLibraryParams) => Promise<LibraryDto | null>;
  archiveLibrary: (params: ArchiveLibraryParams) => Promise<boolean>;
}

function mapLibraryRecordToDto(record: LibraryRecord): LibraryDto {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    absolutePath: record.absolute_path,
    projectId: record.project_id,
    status: record.status,
    isActive: record.is_active,
    createdBy: record.created_by,
    createdAt: record.created_at.toISOString(),
  };
}

function buildLibrariesService(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
): LibrariesServiceMethods {
  const db: Knex = fastify.db;

  async function ensureUserIsMemberOfProject(
    userId: string,
    projectId: string,
  ): Promise<boolean> {
    const row = await db("project_members")
      .where({
        project_id: projectId,
        user_id: userId,
      })
      .first();
    return Boolean(row);
  }

  async function ensureUserIsOwnerOfProject(
    userId: string,
    projectId: string,
  ): Promise<boolean> {
    const row = await db("project_members")
      .where({
        project_id: projectId,
        user_id: userId,
        is_owner: true,
      })
      .first();
    return Boolean(row);
  }

  async function listLibraries(
    filters: ListLibrariesFilters,
    userId: string,
  ): Promise<PaginatedResult<LibraryDto>> {
    const baseQuery = db<LibraryRecord>("library")
      .select<LibraryRecord[]>("library.*")
      .join("project_members", function joinProjectMembers() {
        this.on("project_members.project_id", "library.project_id").andOn(
          "project_members.user_id",
          db.raw("?", [userId]),
        );
      });
    if (filters.projectId) {
      baseQuery.where("library.project_id", filters.projectId);
    }
    const countResult = await baseQuery.clone().count<{ count: string }[]>({
      count: "*",
    });
    const total = Number(countResult[0]?.count ?? 0);
    const pagedQuery = applyPagination(baseQuery, filters);
    const rows = await pagedQuery;
    const items = rows.map(mapLibraryRecordToDto);
    return buildPaginatedResult(items, total, filters.page, filters.pageSize);
  }

  async function createLibrary(params: CreateLibraryParams): Promise<LibraryDto | null> {
    const isOwner = await ensureUserIsOwnerOfProject(params.userId, params.projectId);
    if (!isOwner) {
      return null;
    }
    const insertedRows = await db<LibraryRecord>("library")
      .insert(
        {
          name: params.name,
          description: params.description ?? null,
          absolute_path: params.absolutePath,
          project_id: params.projectId,
          created_by: params.userId,
        },
        "*",
      )
      .then((rows: LibraryRecord[]) => rows);
    const inserted = insertedRows[0];
    return mapLibraryRecordToDto(inserted);
  }

  async function getLibrary(params: GetLibraryParams): Promise<LibraryDto | null> {
    const row = await db<LibraryRecord>("library")
      .select<LibraryRecord[]>("library.*")
      .join("project_members", function joinProjectMembers() {
        this.on("project_members.project_id", "library.project_id").andOn(
          "project_members.user_id",
          db.raw("?", [params.userId]),
        );
      })
      .where("library.id", params.libraryId)
      .first();
    if (!row) {
      return null;
    }
    return mapLibraryRecordToDto(row);
  }

  async function updateLibrary(params: UpdateLibraryParams): Promise<LibraryDto | null> {
    const libraryRow = await db<LibraryRecord>("library")
      .where("id", params.libraryId)
      .first();
    if (!libraryRow) {
      return null;
    }
    const isOwner = await ensureUserIsOwnerOfProject(params.userId, libraryRow.project_id);
    if (!isOwner) {
      return null;
    }
    const patch: Partial<LibraryRecord> = {};
    if (typeof params.name !== "undefined") {
      patch.name = params.name;
    }
    if (typeof params.description !== "undefined") {
      patch.description = params.description;
    }
    if (typeof params.status !== "undefined") {
      patch.status = params.status;
    }
    if (typeof params.isActive !== "undefined") {
      patch.is_active = params.isActive;
    }
    if (Object.keys(patch).length === 0) {
      return mapLibraryRecordToDto(libraryRow);
    }
    const updatedRows = await db<LibraryRecord>("library")
      .where("id", params.libraryId)
      .update(patch, "*")
      .then((rows: LibraryRecord[]) => rows);
    const updated = updatedRows[0];
    if (!updated) {
      return null;
    }
    return mapLibraryRecordToDto(updated);
  }

  async function archiveLibrary(params: ArchiveLibraryParams): Promise<boolean> {
    const libraryRow = await db<LibraryRecord>("library")
      .where("id", params.libraryId)
      .first();
    if (!libraryRow) {
      return false;
    }
    const isOwner = await ensureUserIsOwnerOfProject(params.userId, libraryRow.project_id);
    if (!isOwner) {
      return false;
    }
    const updatedCount = await db<LibraryRecord>("library")
      .where("id", params.libraryId)
      .update({
        is_active: false,
        status: "completed",
      });
    return updatedCount > 0;
  }

  return {
    listLibraries,
    createLibrary,
    getLibrary,
    updateLibrary,
    archiveLibrary,
  };
}

export default buildLibrariesService;


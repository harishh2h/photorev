import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Knex } from "knex";

export interface ProjectMemberRecord {
  readonly project_id: string;
  readonly user_id: string;
  readonly is_owner: boolean;
  readonly created_at: Date;
}

export interface ProjectMemberDto {
  readonly projectId: string;
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly isOwner: boolean;
  readonly joinedAt: string;
}

export interface ListMembersParams {
  readonly requesterId: string;
  readonly projectId: string;
}

export interface AddMemberParams {
  readonly requesterId: string;
  readonly projectId: string;
  readonly userId: string;
  readonly isOwner?: boolean;
}

export interface RemoveMemberParams {
  readonly requesterId: string;
  readonly projectId: string;
  readonly userId: string;
}

export interface UpdateMemberParams {
  readonly requesterId: string;
  readonly projectId: string;
  readonly userId: string;
  readonly isOwner: boolean;
}

export interface ProjectMembersServiceMethods {
  listMembers: (params: ListMembersParams) => Promise<ProjectMemberDto[]>;
  addMember: (params: AddMemberParams) => Promise<ProjectMemberDto | null>;
  removeMember: (params: RemoveMemberParams) => Promise<boolean>;
  updateMember: (params: UpdateMemberParams) => Promise<ProjectMemberDto | null>;
}

function mapMemberRowToDto(row: any): ProjectMemberDto {
  return {
    projectId: row.project_id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    isOwner: row.is_owner,
    joinedAt: row.created_at.toISOString(),
  };
}

function buildProjectMembersService(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
): ProjectMembersServiceMethods {
  const db: Knex = fastify.db;

  async function ensureRequesterIsOwner(
    requesterId: string,
    projectId: string,
  ): Promise<boolean> {
    const ownerRow = await db<ProjectMemberRecord>("project_members")
      .where({
        project_id: projectId,
        user_id: requesterId,
        is_owner: true,
      })
      .first();
    return Boolean(ownerRow);
  }

  async function listMembers(params: ListMembersParams): Promise<ProjectMemberDto[]> {
    const isOwner = await ensureRequesterIsOwner(params.requesterId, params.projectId);
    if (!isOwner) {
      return [];
    }
    const rows = await db("project_members")
      .join("users", "users.id", "project_members.user_id")
      .select(
        "project_members.project_id",
        "project_members.user_id",
        "project_members.is_owner",
        "project_members.created_at",
        "users.name",
        "users.email",
      )
      .where("project_members.project_id", params.projectId);
    return rows.map(mapMemberRowToDto);
  }

  async function addMember(params: AddMemberParams): Promise<ProjectMemberDto | null> {
    const isOwner = await ensureRequesterIsOwner(params.requesterId, params.projectId);
    if (!isOwner) {
      return null;
    }
    const existing = await db<ProjectMemberRecord>("project_members")
      .where({
        project_id: params.projectId,
        user_id: params.userId,
      })
      .first();
    if (existing) {
      const joined = await db("project_members")
        .join("users", "users.id", "project_members.user_id")
        .select(
          "project_members.project_id",
          "project_members.user_id",
          "project_members.is_owner",
          "project_members.created_at",
          "users.name",
          "users.email",
        )
        .where("project_members.project_id", params.projectId)
        .andWhere("project_members.user_id", params.userId)
        .first();
      if (!joined) {
        return null;
      }
      return mapMemberRowToDto(joined);
    }
    const inserted = await db<ProjectMemberRecord>("project_members")
      .insert(
        {
          project_id: params.projectId,
          user_id: params.userId,
          is_owner: Boolean(params.isOwner),
        },
        "*",
      )
      .then((rows: ProjectMemberRecord[]) => rows[0]);
    const userRow = await db("users")
      .select("name", "email")
      .where("id", params.userId)
      .first();
    return {
      projectId: inserted.project_id,
      userId: inserted.user_id,
      isOwner: inserted.is_owner,
      joinedAt: inserted.created_at.toISOString(),
      name: userRow?.name ?? "",
      email: userRow?.email ?? "",
    };
  }

  async function removeMember(params: RemoveMemberParams): Promise<boolean> {
    const isOwner = await ensureRequesterIsOwner(params.requesterId, params.projectId);
    if (!isOwner) {
      return false;
    }
    const memberRow = await db<ProjectMemberRecord>("project_members")
      .where({
        project_id: params.projectId,
        user_id: params.userId,
      })
      .first();
    if (!memberRow) {
      return false;
    }
    if (memberRow.is_owner) {
      const ownersCountResult = await db<ProjectMemberRecord>("project_members")
        .where({
          project_id: params.projectId,
          is_owner: true,
        })
        .count<{ count: string }[]>({ count: "*" });
      const ownersCount = Number(ownersCountResult[0]?.count ?? 0);
      if (ownersCount <= 1) {
        return false;
      }
    }
    const deletedCount = await db<ProjectMemberRecord>("project_members")
      .where({
        project_id: params.projectId,
        user_id: params.userId,
      })
      .delete();
    return deletedCount > 0;
  }

  async function updateMember(params: UpdateMemberParams): Promise<ProjectMemberDto | null> {
    const isOwner = await ensureRequesterIsOwner(params.requesterId, params.projectId);
    if (!isOwner) {
      return null;
    }
    const targetRow = await db<ProjectMemberRecord>("project_members")
      .where({
        project_id: params.projectId,
        user_id: params.userId,
      })
      .first();
    if (!targetRow) {
      return null;
    }
    if (targetRow.is_owner && !params.isOwner) {
      const ownersCountResult = await db<ProjectMemberRecord>("project_members")
        .where({
          project_id: params.projectId,
          is_owner: true,
        })
        .count<{ count: string }[]>({ count: "*" });
      const ownersCount = Number(ownersCountResult[0]?.count ?? 0);
      if (ownersCount <= 1) {
        return null;
      }
    }
    const updatedRows = await db<ProjectMemberRecord>("project_members")
      .where({
        project_id: params.projectId,
        user_id: params.userId,
      })
      .update(
        {
          is_owner: params.isOwner,
        },
        "*",
      )
      .then((rows: ProjectMemberRecord[]) => rows);
    const updated = updatedRows[0];
    if (!updated) {
      return null;
    }
    const userRow = await db("users")
      .select("name", "email")
      .where("id", updated.user_id)
      .first();
    return {
      projectId: updated.project_id,
      userId: updated.user_id,
      isOwner: updated.is_owner,
      joinedAt: updated.created_at.toISOString(),
      name: userRow?.name ?? "",
      email: userRow?.email ?? "",
    };
  }

  return {
    listMembers,
    addMember,
    removeMember,
    updateMember,
  };
}

export default buildProjectMembersService;


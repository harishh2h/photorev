import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Knex } from "knex";
import type { CollaboratorRole } from "../utils/project-permissions";
import { parseCollaboratorRole } from "../utils/project-permissions";

export interface ProjectMemberRecord {
  readonly project_id: string;
  readonly user_id: string;
  readonly is_owner: boolean;
  readonly role: string;
  readonly created_at: Date;
}

export interface ProjectMemberDto {
  readonly projectId: string;
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly isOwner: boolean;
  readonly role: CollaboratorRole;
  readonly isCreator: boolean;
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
  readonly role: CollaboratorRole;
}

export interface AddMemberResult {
  readonly member: ProjectMemberDto;
  readonly created: boolean;
}

export interface RemoveMemberParams {
  readonly requesterId: string;
  readonly projectId: string;
  readonly userId: string;
}

export interface UpdateMemberRoleParams {
  readonly requesterId: string;
  readonly projectId: string;
  readonly userId: string;
  readonly role: CollaboratorRole;
}

export interface LookupMemberByEmailParams {
  readonly requesterId: string;
  readonly projectId: string;
  readonly normalizedEmail: string;
}

export type LookupMemberByEmailResult =
  | { readonly allowed: false }
  | {
      readonly allowed: true;
      readonly user: { readonly id: string; readonly name: string; readonly email: string } | null;
    };

export interface ProjectMembersServiceMethods {
  listMembers: (params: ListMembersParams) => Promise<ProjectMemberDto[] | null>;
  addMember: (params: AddMemberParams) => Promise<AddMemberResult | null>;
  removeMember: (params: RemoveMemberParams) => Promise<boolean>;
  updateMemberRole: (params: UpdateMemberRoleParams) => Promise<ProjectMemberDto | null>;
  lookupUserByEmail: (params: LookupMemberByEmailParams) => Promise<LookupMemberByEmailResult>;
}

type MemberJoinedRow = {
  project_id: string;
  user_id: string;
  is_owner: boolean;
  role: string;
  created_at: Date;
  name: string;
  email: string;
  created_by: string;
};

function mapMemberRowToDto(row: MemberJoinedRow): ProjectMemberDto {
  return {
    projectId: row.project_id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    isOwner: row.is_owner,
    role: parseCollaboratorRole(row.role),
    isCreator: row.user_id === row.created_by,
    joinedAt: row.created_at.toISOString(),
  };
}

async function fetchMemberDto(
  db: Knex,
  projectId: string,
  userId: string,
): Promise<ProjectMemberDto | null> {
  const row = await db("project_members")
    .join("users", "users.id", "project_members.user_id")
    .join("projects", "projects.id", "project_members.project_id")
    .select(
      "project_members.project_id",
      "project_members.user_id",
      "project_members.is_owner",
      "project_members.role",
      "project_members.created_at",
      "users.name",
      "users.email",
      "projects.created_by",
    )
    .where("project_members.project_id", projectId)
    .andWhere("project_members.user_id", userId)
    .whereNot("projects.status", "deleted")
    .first<MemberJoinedRow>();
  return row ? mapMemberRowToDto(row) : null;
}

function buildProjectMembersService(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
): ProjectMembersServiceMethods {
  const db: Knex = fastify.db;

  async function ensureRequesterIsProjectCreator(
    requesterId: string,
    projectId: string,
  ): Promise<boolean> {
    const row = await db("projects")
      .where({ id: projectId, created_by: requesterId })
      .whereNot("status", "deleted")
      .first();
    return Boolean(row);
  }

  async function ensureRequesterIsMember(
    requesterId: string,
    projectId: string,
  ): Promise<boolean> {
    const row = await db("project_members")
      .join("projects", "projects.id", "project_members.project_id")
      .where({
        project_id: projectId,
        user_id: requesterId,
      })
      .whereNot("projects.status", "deleted")
      .first();
    return Boolean(row);
  }

  async function listMembers(params: ListMembersParams): Promise<ProjectMemberDto[] | null> {
    const isMember = await ensureRequesterIsMember(params.requesterId, params.projectId);
    if (!isMember) {
      return null;
    }
    const rows = await db("project_members")
      .join("users", "users.id", "project_members.user_id")
      .join("projects", "projects.id", "project_members.project_id")
      .select(
        "project_members.project_id",
        "project_members.user_id",
        "project_members.is_owner",
        "project_members.role",
        "project_members.created_at",
        "users.name",
        "users.email",
        "projects.created_by",
      )
      .where("project_members.project_id", params.projectId)
      .whereNot("projects.status", "deleted")
      .orderBy("project_members.created_at", "asc");
    return rows.map((r: MemberJoinedRow) => mapMemberRowToDto(r));
  }

  async function addMember(params: AddMemberParams): Promise<AddMemberResult | null> {
    const isCreator = await ensureRequesterIsProjectCreator(params.requesterId, params.projectId);
    if (!isCreator) {
      return null;
    }
    const project = await db<{ created_by: string }>("projects")
      .select("created_by")
      .where("id", params.projectId)
      .first();
    if (!project) {
      return null;
    }
    if (params.userId === project.created_by) {
      const existingCreator = await fetchMemberDto(db, params.projectId, params.userId);
      if (!existingCreator) {
        return null;
      }
      return { member: existingCreator, created: false };
    }

    const existing = await db<ProjectMemberRecord>("project_members")
      .where({
        project_id: params.projectId,
        user_id: params.userId,
      })
      .first();
    if (existing) {
      const dto = await fetchMemberDto(db, params.projectId, params.userId);
      if (!dto) {
        return null;
      }
      return { member: dto, created: false };
    }

    await db<ProjectMemberRecord>("project_members").insert({
      project_id: params.projectId,
      user_id: params.userId,
      is_owner: false,
      role: params.role,
    });
    const dto = await fetchMemberDto(db, params.projectId, params.userId);
    if (!dto) {
      return null;
    }
    return { member: dto, created: true };
  }

  async function removeMember(params: RemoveMemberParams): Promise<boolean> {
    const isCreator = await ensureRequesterIsProjectCreator(params.requesterId, params.projectId);
    if (!isCreator) {
      return false;
    }
    const project = await db<{ created_by: string }>("projects")
      .select("created_by")
      .where("id", params.projectId)
      .first();
    if (!project) {
      return false;
    }
    if (params.userId === project.created_by) {
      return false;
    }
    const deletedCount = await db<ProjectMemberRecord>("project_members")
      .where({
        project_id: params.projectId,
        user_id: params.userId,
      })
      .delete();
    return deletedCount > 0;
  }

  async function updateMemberRole(
    params: UpdateMemberRoleParams,
  ): Promise<ProjectMemberDto | null> {
    const isCreator = await ensureRequesterIsProjectCreator(params.requesterId, params.projectId);
    if (!isCreator) {
      return null;
    }
    const project = await db<{ created_by: string }>("projects")
      .select("created_by")
      .where("id", params.projectId)
      .first();
    if (!project) {
      return null;
    }
    if (params.userId === project.created_by) {
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
    const updatedRows = await db<ProjectMemberRecord>("project_members")
      .where({
        project_id: params.projectId,
        user_id: params.userId,
      })
      .update({ role: params.role }, "*")
      .then((rows: ProjectMemberRecord[]) => rows);
    const updated = updatedRows[0];
    if (!updated) {
      return null;
    }
    return fetchMemberDto(db, params.projectId, params.userId);
  }

  async function lookupUserByEmail(params: LookupMemberByEmailParams): Promise<LookupMemberByEmailResult> {
    const isCreator = await ensureRequesterIsProjectCreator(params.requesterId, params.projectId);
    if (!isCreator) {
      return { allowed: false };
    }
    const row = await db<{ id: string; name: string; email: string }>("users")
      .select("id", "name", "email")
      .where({ email: params.normalizedEmail })
      .first();
    if (!row) {
      return { allowed: true, user: null };
    }
    return { allowed: true, user: { id: row.id, name: row.name, email: row.email } };
  }

  return {
    listMembers,
    addMember,
    removeMember,
    updateMemberRole,
    lookupUserByEmail,
  };
}

export default buildProjectMembersService;

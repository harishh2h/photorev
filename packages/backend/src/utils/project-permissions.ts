import type { Knex } from "knex";

export type CollaboratorRole = "viewer" | "reviewer" | "contributor";

const ROLES: ReadonlySet<string> = new Set(["viewer", "reviewer", "contributor"]);

export function parseCollaboratorRole(raw: unknown): CollaboratorRole {
  if (typeof raw === "string" && ROLES.has(raw)) {
    return raw as CollaboratorRole;
  }
  return "reviewer";
}

export interface ProjectPermissionContext {
  readonly createdBy: string;
  readonly userId: string;
  readonly role: CollaboratorRole;
  readonly isCreator: boolean;
}

export async function loadProjectPermissionContext(
  db: Knex,
  userId: string,
  projectId: string,
): Promise<ProjectPermissionContext | null> {
  const row = await db("projects")
    .select(
      "projects.created_by as created_by",
      "project_members.role as member_role",
    )
    .leftJoin("project_members", function joinMember() {
      this.on("project_members.project_id", "projects.id").andOn(
        "project_members.user_id",
        db.raw("?", [userId]),
      );
    })
    .where("projects.id", projectId)
    .first<{
      created_by: string;
      member_role: string | null;
    }>();

  if (!row || row.member_role == null) {
    return null;
  }

  const createdBy = row.created_by;
  const role = parseCollaboratorRole(row.member_role);
  const isCreator = createdBy === userId;

  return { createdBy, userId, role, isCreator };
}

export function canReviewPhotos(ctx: ProjectPermissionContext): boolean {
  return ctx.isCreator || (ctx.role !== "viewer");
}

export function canUploadPhotos(ctx: ProjectPermissionContext): boolean {
  return ctx.isCreator || ctx.role === "contributor";
}

export function canEditPhotoMetadata(ctx: ProjectPermissionContext): boolean {
  return ctx.isCreator || ctx.role === "contributor";
}

export function canManageProjectMembers(requesterId: string, createdBy: string): boolean {
  return requesterId === createdBy;
}

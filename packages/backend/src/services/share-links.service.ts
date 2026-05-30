import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Knex } from "knex";
import type { ShareLink } from "../models/share-link";

const BCRYPT_ROUNDS = 10;
const TOKEN_BYTES = 24;

export interface ShareLinkDto {
  readonly id: string;
  readonly projectId: string;
  readonly token: string;
  readonly hasPassword: boolean;
  readonly description: string | null;
  readonly showMetadata: boolean;
  readonly allowDownload: boolean;
  readonly expiresAt: string | null;
  readonly revokedAt: string | null;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly viewCount: number;
  readonly lastViewedAt: string | null;
}

export interface CreateShareLinkOptions {
  readonly description?: string | null;
  readonly password?: string | null;
  readonly showMetadata?: boolean;
  readonly allowDownload?: boolean;
  readonly expiresAt?: string | null;
}

export interface CreateShareLinkParams {
  readonly userId: string;
  readonly projectId: string;
  readonly opts: CreateShareLinkOptions;
}

export interface RevokeShareLinkParams {
  readonly userId: string;
  readonly projectId: string;
  readonly linkId: string;
}

export interface GetActiveShareLinkParams {
  readonly userId: string;
  readonly projectId: string;
}

export type ShareLinkMutationResult =
  | { readonly ok: true; readonly link: ShareLinkDto }
  | { readonly ok: false; readonly reason: "not_found" | "forbidden" };

export type ShareLinkRevokeResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "not_found" | "forbidden" };

export type VerifyShareTokenResult =
  | { readonly ok: true; readonly link: ShareLink }
  | {
      readonly ok: false;
      readonly reason: "not_found" | "expired" | "revoked" | "password_required" | "bad_password";
    };

export interface ShareLinksServiceMethods {
  createOrReplaceShareLink: (params: CreateShareLinkParams) => Promise<ShareLinkMutationResult>;
  getActiveShareLink: (params: GetActiveShareLinkParams) => Promise<ShareLinkDto | null>;
  revokeShareLink: (params: RevokeShareLinkParams) => Promise<ShareLinkRevokeResult>;
  verifyShareToken: (token: string, password: string | null) => Promise<VerifyShareTokenResult>;
  loadShareByToken: (token: string) => Promise<ShareLink | null>;
  recordView: (shareId: string, viewSessionId: string) => Promise<boolean>;
}

function generateToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

function mapShareLinkToDto(row: ShareLink): ShareLinkDto {
  return {
    id: row.id,
    projectId: row.project_id,
    token: row.token,
    hasPassword: row.password_hash != null,
    description: row.description,
    showMetadata: row.show_metadata,
    allowDownload: row.allow_download,
    expiresAt: row.expires_at ? row.expires_at.toISOString() : null,
    revokedAt: row.revoked_at ? row.revoked_at.toISOString() : null,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
    viewCount: Number(row.view_count ?? 0),
    lastViewedAt: row.last_viewed_at ? row.last_viewed_at.toISOString() : null,
  };
}

function buildShareLinksService(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
): ShareLinksServiceMethods {
  const db: Knex = fastify.db;

  async function gateOwner(
    userId: string,
    projectId: string,
  ): Promise<"not_found" | "forbidden" | "ok"> {
    const row = await db<{ created_by: string; status: string }>("projects")
      .select("created_by", "status")
      .where("id", projectId)
      .first();
    if (!row || row.status === "deleted") return "not_found";
    if (row.created_by !== userId) return "forbidden";
    return "ok";
  }

  async function createOrReplaceShareLink(
    params: CreateShareLinkParams,
  ): Promise<ShareLinkMutationResult> {
    const gate = await gateOwner(params.userId, params.projectId);
    if (gate === "not_found") return { ok: false, reason: "not_found" };
    if (gate === "forbidden") return { ok: false, reason: "forbidden" };

    const opts = params.opts;
    const passwordHash =
      typeof opts.password === "string" && opts.password.trim().length > 0
        ? await bcrypt.hash(opts.password, BCRYPT_ROUNDS)
        : null;
    const expiresAt = opts.expiresAt ? new Date(opts.expiresAt) : null;
    const token = generateToken();

    const link = await db.transaction(async (trx: Knex.Transaction) => {
      await trx("share_links")
        .where({ project_id: params.projectId })
        .whereNull("revoked_at")
        .update({ revoked_at: new Date() });
      const rows = await trx<ShareLink>("share_links").insert(
        {
          project_id: params.projectId,
          token,
          password_hash: passwordHash,
          description: opts.description ?? null,
          show_metadata: opts.showMetadata ?? false,
          allow_download: opts.allowDownload ?? true,
          expires_at: expiresAt,
          created_by: params.userId,
        },
        "*",
      );
      return rows[0];
    });
    if (!link) return { ok: false, reason: "not_found" };
    return { ok: true, link: mapShareLinkToDto(link) };
  }

  async function getActiveShareLink(
    params: GetActiveShareLinkParams,
  ): Promise<ShareLinkDto | null> {
    const gate = await gateOwner(params.userId, params.projectId);
    if (gate === "not_found" || gate === "forbidden") return null;
    const row = await db<ShareLink>("share_links")
      .where({ project_id: params.projectId })
      .whereNull("revoked_at")
      .orderBy("created_at", "desc")
      .first();
    if (!row) return null;
    if (row.expires_at && row.expires_at.getTime() < Date.now()) return null;
    return mapShareLinkToDto(row);
  }

  async function revokeShareLink(
    params: RevokeShareLinkParams,
  ): Promise<ShareLinkRevokeResult> {
    const gate = await gateOwner(params.userId, params.projectId);
    if (gate === "not_found") return { ok: false, reason: "not_found" };
    if (gate === "forbidden") return { ok: false, reason: "forbidden" };
    const updated = await db("share_links")
      .where({ id: params.linkId, project_id: params.projectId })
      .whereNull("revoked_at")
      .update({ revoked_at: new Date() });
    if (updated === 0) return { ok: false, reason: "not_found" };
    return { ok: true };
  }

  async function loadShareByToken(token: string): Promise<ShareLink | null> {
    const row = await db<ShareLink>("share_links").where("token", token).first();
    return row ?? null;
  }

  async function verifyShareToken(
    token: string,
    password: string | null,
  ): Promise<VerifyShareTokenResult> {
    const row = await loadShareByToken(token);
    if (!row) return { ok: false, reason: "not_found" };
    if (row.revoked_at) return { ok: false, reason: "revoked" };
    if (row.expires_at && row.expires_at.getTime() < Date.now()) {
      return { ok: false, reason: "expired" };
    }
    if (row.password_hash) {
      if (!password) return { ok: false, reason: "password_required" };
      const ok = await bcrypt.compare(password, row.password_hash);
      if (!ok) return { ok: false, reason: "bad_password" };
    }
    return { ok: true, link: row };
  }

  async function recordView(shareId: string, viewSessionId: string): Promise<boolean> {
    const sessionId = viewSessionId.trim().slice(0, 64);
    if (sessionId.length < 8) {
      return false;
    }

    const inserted = await db<{ share_link_id: string }>("share_link_view_sessions")
      .insert({
        share_link_id: shareId,
        view_session_id: sessionId,
      })
      .onConflict(["share_link_id", "view_session_id"])
      .ignore()
      .returning("share_link_id");

    if (inserted.length === 0) {
      return false;
    }

    await db("share_links")
      .where("id", shareId)
      .update({
        view_count: db.raw("view_count + 1"),
        last_viewed_at: new Date(),
      });
    return true;
  }

  return {
    createOrReplaceShareLink,
    getActiveShareLink,
    revokeShareLink,
    verifyShareToken,
    loadShareByToken,
    recordView,
  };
}

export default buildShareLinksService;

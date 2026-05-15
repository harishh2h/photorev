import path from "node:path";

import buildApp from "../app";

describe("Projects CRUD API", () => {
  it("should create a project and membership for the owner", async () => {
    const app = buildApp({ logger: false });
    await app.ready();

    try {
      const existingUser = await (app as any)
        .db("users")
        .where({ email: "owner@example.com" })
        .first();

      let ownerId: string;
      if (existingUser) {
        ownerId = existingUser.id as string;
      } else {
        const insertUserResult = await (app as any).db("users")
          .insert(
            {
              email: "owner@example.com",
              name: "Owner User",
              password_hash: "hash",
              role: "reviewer",
            },
            ["id"],
          )
          .then((rows: { id: string }[]) => rows[0]);
        ownerId = insertUserResult.id;
      }

      const response = await app.inject({
        method: "POST",
        url: "/projects",
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": ownerId,
        },
        payload: {
          name: "Test Project",
          rootPath: "projects/custom-root",
        },
      });

      expect(response.statusCode).toBe(201);
      const envelope = response.json() as {
        error: boolean;
        message: string;
        data: {
          id: string;
          name: string;
          rootPath: string;
          createdBy: string;
          metadata: Record<string, unknown>;
        };
      };
      expect(envelope.error).toBe(false);
      expect(envelope.data.name).toBe("Test Project");
      expect(envelope.data.rootPath).toBe("projects/custom-root");
      expect(envelope.data.createdBy).toBe(ownerId);
      expect(envelope.data.metadata).toEqual({});

      const members = await (app as any)
        .db("project_members")
        .where({
          project_id: envelope.data.id,
          user_id: ownerId,
        });

      expect(members.length).toBe(1);
      expect(members[0].is_owner).toBe(true);
      expect(members[0].role).toBe("contributor");
    } finally {
      await app.close();
    }
  });

  it("should create a project without rootPath and assign default storage path", async () => {
    const app = buildApp({ logger: false });
    await app.ready();
    try {
      const existingUser = await (app as any)
        .db("users")
        .where({ email: "owner2@example.com" })
        .first();
      let ownerId: string;
      if (existingUser) {
        ownerId = existingUser.id as string;
      } else {
        const insertUserResult = await (app as any).db("users")
          .insert(
            {
              email: "owner2@example.com",
              name: "Owner Two",
              password_hash: "hash",
              role: "reviewer",
            },
            ["id"],
          )
          .then((rows: { id: string }[]) => rows[0]);
        ownerId = insertUserResult.id;
      }
      const response = await app.inject({
        method: "POST",
        url: "/projects",
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": ownerId,
        },
        payload: {
          name: "Auto Path Project",
        },
      });
      expect(response.statusCode).toBe(201);
      const envelope = response.json() as {
        error: boolean;
        data: { id: string; name: string; rootPath: string; metadata: Record<string, unknown> };
      };
      expect(envelope.error).toBe(false);
      expect(envelope.data.name).toBe("Auto Path Project");
      expect(envelope.data.rootPath).toMatch(/^projects\/[0-9a-f-]{36}$/iu);
      expect(envelope.data.metadata).toEqual({});
    } finally {
      await app.close();
    }
  });

  it("should merge metadata on PATCH and preserve existing keys", async () => {
    const app = buildApp({ logger: false });
    await app.ready();
    try {
      const existingUser = await (app as any)
        .db("users")
        .where({ email: "owner3@example.com" })
        .first();
      let ownerId: string;
      if (existingUser) {
        ownerId = existingUser.id as string;
      } else {
        const insertUserResult = await (app as any).db("users")
          .insert(
            {
              email: "owner3@example.com",
              name: "Owner Three",
              password_hash: "hash",
              role: "reviewer",
            },
            ["id"],
          )
          .then((rows: { id: string }[]) => rows[0]);
        ownerId = insertUserResult.id;
      }
      const createResponse = await app.inject({
        method: "POST",
        url: "/projects",
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": ownerId,
        },
        payload: {
          name: "Metadata Project",
          rootPath: "projects/meta-root",
        },
      });
      expect(createResponse.statusCode).toBe(201);
      const created = createResponse.json() as {
        data: { id: string; metadata: Record<string, unknown> };
      };
      const projectId = created.data.id;
      expect(created.data.metadata).toEqual({});

      const bannerUrl = "https://example.com/banner.jpg";
      const patch1 = await app.inject({
        method: "PATCH",
        url: `/projects/${projectId}`,
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": ownerId,
        },
        payload: {
          metadata: { banner: bannerUrl },
        },
      });
      expect(patch1.statusCode).toBe(200);
      const afterBanner = patch1.json() as { data: { metadata: { banner?: string } } };
      expect(afterBanner.data.metadata.banner).toBe(bannerUrl);

      const patch2 = await app.inject({
        method: "PATCH",
        url: `/projects/${projectId}`,
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": ownerId,
        },
        payload: {
          metadata: { note: "keep-banner" },
        },
      });
      expect(patch2.statusCode).toBe(200);
      const afterNote = patch2.json() as {
        data: { metadata: { banner?: string; note?: string } };
      };
      expect(afterNote.data.metadata.banner).toBe(bannerUrl);
      expect(afterNote.data.metadata.note).toBe("keep-banner");

      const patchBadBanner = await app.inject({
        method: "PATCH",
        url: `/projects/${projectId}`,
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": ownerId,
        },
        payload: {
          metadata: { banner: "file:///etc/passwd" },
        },
      });
      expect(patchBadBanner.statusCode).toBe(200);
      const afterBad = patchBadBanner.json() as {
        data: { metadata: Record<string, unknown> };
      };
      expect(typeof afterBad.data.metadata.banner).toBe("undefined");
      expect(afterBad.data.metadata.note).toBe("keep-banner");

      const getProject = await app.inject({
        method: "GET",
        url: `/projects/${projectId}`,
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": ownerId,
        },
      });
      expect(getProject.statusCode).toBe(200);
      const got = getProject.json() as {
        data: { metadata: Record<string, unknown>; rootPath: string };
      };
      expect(typeof got.data.metadata.banner).toBe("undefined");
      expect(got.data.rootPath).not.toContain("tmp");
      expect(got.data.rootPath).toMatch(/^projects\//iu);
    } finally {
      await app.close();
    }
  });

  it("should reject rootPath outside the storage root", async () => {
    const app = buildApp({ logger: false });
    await app.ready();
    try {
      const existingUser = await (app as any)
        .db("users")
        .where({ email: "owner_outside_root@example.com" })
        .first();
      let ownerId: string;
      if (existingUser) {
        ownerId = existingUser.id as string;
      } else {
        const insertUserResult = await (app as any).db("users")
          .insert(
            {
              email: "owner_outside_root@example.com",
              name: "Outside",
              password_hash: "hash",
              role: "reviewer",
            },
            ["id"],
          )
          .then((rows: { id: string }[]) => rows[0]);
        ownerId = insertUserResult.id;
      }
      const response = await app.inject({
        method: "POST",
        url: "/projects",
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": ownerId,
        },
        payload: {
          name: "Bad Root",
          rootPath: "/tmp/outside-storage",
        },
      });
      expect(response.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });

  it("should return 404 for cover-photo when user is not a project member", async () => {
    const app = buildApp({ logger: false });
    await app.ready();
    try {
      const u = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const db = (app as any).db;
      const owner = await db("users")
        .insert(
          { email: `cover_owner_${u}@example.com`, name: "Cover Owner", password_hash: "h", role: "reviewer" },
          ["id"],
        )
        .then((rows: { id: string }[]) => rows[0]);
      const stranger = await db("users")
        .insert(
          { email: `cover_stranger_${u}@example.com`, name: "Stranger", password_hash: "h", role: "reviewer" },
          ["id"],
        )
        .then((rows: { id: string }[]) => rows[0]);
      const project = await db("projects")
        .insert(
          {
            name: "Cover Test Project",
            root_path: "/tmp/cover-test",
            created_by: owner.id,
          },
          ["id"],
        )
        .then((rows: { id: string }[]) => rows[0]);
      await db("project_members").insert({ project_id: project.id, user_id: owner.id, is_owner: true, role: "contributor" });
      const res = await app.inject({
        method: "GET",
        url: `/projects/${project.id}/cover-photo`,
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": stranger.id,
        },
      });
      expect(res.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it("should return photoId null for cover-photo when project has no ready previews", async () => {
    const app = buildApp({ logger: false });
    await app.ready();
    try {
      const u = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const db = (app as any).db;
      const owner = await db("users")
        .insert(
          { email: `cover_empty_${u}@example.com`, name: "Cover Empty", password_hash: "h", role: "reviewer" },
          ["id"],
        )
        .then((rows: { id: string }[]) => rows[0]);
      const project = await db("projects")
        .insert(
          {
            name: "No Photos Project",
            root_path: "/tmp/no-photos",
            created_by: owner.id,
          },
          ["id"],
        )
        .then((rows: { id: string }[]) => rows[0]);
      await db("project_members").insert({ project_id: project.id, user_id: owner.id, is_owner: true, role: "contributor" });
      const res = await app.inject({
        method: "GET",
        url: `/projects/${project.id}/cover-photo`,
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": owner.id,
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { error: boolean; data: { photoId: string | null } };
      expect(body.error).toBe(false);
      expect(body.data.photoId).toBeNull();
    } finally {
      await app.close();
    }
  });

  it("should return a random ready photo id for cover-photo", async () => {
    const app = buildApp({ logger: false });
    await app.ready();
    try {
      const u = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const db = (app as any).db;
      const owner = await db("users")
        .insert(
          { email: `cover_ready_${u}@example.com`, name: "Cover Ready", password_hash: "h", role: "reviewer" },
          ["id"],
        )
        .then((rows: { id: string }[]) => rows[0]);
      const project = await db("projects")
        .insert(
          {
            name: "Ready Photos Project",
            root_path: "/tmp/ready-photos",
            created_by: owner.id,
          },
          ["id"],
        )
        .then((rows: { id: string }[]) => rows[0]);
      await db("project_members").insert({ project_id: project.id, user_id: owner.id, is_owner: true, role: "contributor" });
      const photoStubA = path.posix.join(
        "photos",
        project.id,
        "11111111-1111-1111-1111-111111111111",
        "original.jpg",
      );
      const photoStubB = path.posix.join(
        "photos",
        project.id,
        "22222222-2222-2222-2222-222222222222",
        "original.jpg",
      );
      const insertedA = await db("photos").insert(
        {
          project_id: project.id,
          original_path: photoStubA,
          original_name: "a.jpg",
          status: "ready",
          preview_path: path.posix.join(
            path.posix.dirname(photoStubA),
            "preview.jpeg",
          ),
        },
        ["id"],
      );
      const insertedB = await db("photos").insert(
        {
          project_id: project.id,
          original_path: photoStubB,
          original_name: "b.jpg",
          status: "ready",
          preview_path: path.posix.join(
            path.posix.dirname(photoStubB),
            "preview.jpeg",
          ),
        },
        ["id"],
      );
      const idA = (insertedA[0] as { id: string }).id;
      const idB = (insertedB[0] as { id: string }).id;
      const res = await app.inject({
        method: "GET",
        url: `/projects/${project.id}/cover-photo`,
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": owner.id,
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { error: boolean; data: { photoId: string | null } };
      expect(body.error).toBe(false);
      expect([idA, idB]).toContain(body.data.photoId);
    } finally {
      await app.close();
    }
  });

  it("should return viewerContext for the authenticated project member", async () => {
    const app = buildApp({ logger: false });
    await app.ready();
    try {
      const u = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const db = (app as any).db;
      const owner = await db("users")
        .insert(
          { email: `vc_owner_${u}@example.com`, name: "VC Owner", password_hash: "h", role: "reviewer" },
          ["id"],
        )
        .then((rows: { id: string }[]) => rows[0]);
      const createResponse = await app.inject({
        method: "POST",
        url: "/projects",
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": owner.id,
        },
        payload: { name: "Viewer context project" },
      });
      expect(createResponse.statusCode).toBe(201);
      const projectId = (createResponse.json() as { data: { id: string; viewerContext?: { isCreator: boolean; role: string } } }).data.id;
      const createdBody = createResponse.json() as { data: { viewerContext?: { isCreator: boolean; role: string } } };
      expect(createdBody.data.viewerContext?.isCreator).toBe(true);
      expect(createdBody.data.viewerContext?.role).toBe("contributor");

      const getRes = await app.inject({
        method: "GET",
        url: `/projects/${projectId}`,
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": owner.id,
        },
      });
      expect(getRes.statusCode).toBe(200);
      const got = getRes.json() as { data: { viewerContext: { isCreator: boolean; role: string } } };
      expect(got.data.viewerContext.isCreator).toBe(true);
      expect(got.data.viewerContext.role).toBe("contributor");
    } finally {
      await app.close();
    }
  });

  it("should let project creator lookup emails (empty user) but forbid non-creators", async () => {
    const app = buildApp({ logger: false });
    await app.ready();
    try {
      const u = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const db = (app as any).db;
      const owner = await db("users")
        .insert(
          { email: `lu_owner_${u}@example.com`, name: "LU Owner", password_hash: "h", role: "reviewer" },
          ["id"],
        )
        .then((rows: { id: string }[]) => rows[0]);
      const stranger = await db("users")
        .insert(
          { email: `lu_str_${u}@example.com`, name: "Stranger", password_hash: "h", role: "reviewer" },
          ["id"],
        )
        .then((rows: { id: string }[]) => rows[0]);
      const project = await db("projects")
        .insert({ name: "Lookup Project", root_path: `/tmp/lu-${u}`, created_by: owner.id }, ["id"])
        .then((rows: { id: string }[]) => rows[0]);
      await db("project_members").insert({
        project_id: project.id,
        user_id: owner.id,
        is_owner: true,
        role: "contributor",
      });
      await db("project_members").insert({
        project_id: project.id,
        user_id: stranger.id,
        is_owner: false,
        role: "reviewer",
      });

      const okLookup = await app.inject({
        method: "GET",
        url: `/projects/${project.id}/members/lookup?email=missing_${u}@example.com`,
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": owner.id,
        },
      });
      expect(okLookup.statusCode).toBe(200);
      const okBody = okLookup.json() as { data: { user: unknown } };
      expect(okBody.data.user).toBeNull();

      const forbiddenLookup = await app.inject({
        method: "GET",
        url: `/projects/${project.id}/members/lookup?email=any_${u}@example.com`,
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": stranger.id,
        },
      });
      expect(forbiddenLookup.statusCode).toBe(403);
    } finally {
      await app.close();
    }
  });

  it("should forbid viewer role from upserting photo reviews", async () => {
    const app = buildApp({ logger: false });
    await app.ready();
    try {
      const u = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const db = (app as any).db;
      const owner = await db("users")
        .insert(
          { email: `pr_owner_${u}@example.com`, name: "PR Owner", password_hash: "h", role: "reviewer" },
          ["id"],
        )
        .then((rows: { id: string }[]) => rows[0]);
      const viewerUser = await db("users")
        .insert(
          { email: `pr_view_${u}@example.com`, name: "PR Viewer", password_hash: "h", role: "reviewer" },
          ["id"],
        )
        .then((rows: { id: string }[]) => rows[0]);
      const project = await db("projects")
        .insert({ name: "Photo Review Perm", root_path: `/tmp/pr-${u}`, created_by: owner.id }, ["id"])
        .then((rows: { id: string }[]) => rows[0]);
      await db("project_members").insert({
        project_id: project.id,
        user_id: owner.id,
        is_owner: true,
        role: "contributor",
      });
      await db("project_members").insert({
        project_id: project.id,
        user_id: viewerUser.id,
        is_owner: false,
        role: "viewer",
      });
      const photoStub = path.posix.join("photos", project.id, "aaaaaaaa-bbbb-cccc-dddddddddddd", "original.jpg");
      const photo = await db("photos")
        .insert(
          {
            project_id: project.id,
            original_path: photoStub,
            original_name: "x.jpg",
            status: "ready",
          },
          ["id"],
        )
        .then((rows: { id: string }[]) => rows[0]);
      const put = await app.inject({
        method: "PUT",
        url: `/photo-reviews/${photo.id}`,
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": viewerUser.id,
        },
        payload: { decision: 1 },
      });
      expect(put.statusCode).toBe(403);
    } finally {
      await app.close();
    }
  });

  it("should forbid viewer from listing all photo reviews on a photo", async () => {
    const app = buildApp({ logger: false });
    await app.ready();
    try {
      const u = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const db = (app as any).db;
      const owner = await db("users")
        .insert(
          { email: `lr_owner_${u}@example.com`, name: "LR Owner", password_hash: "h", role: "reviewer" },
          ["id"],
        )
        .then((rows: { id: string }[]) => rows[0]);
      const viewerUser = await db("users")
        .insert(
          { email: `lr_view_${u}@example.com`, name: "LR Viewer", password_hash: "h", role: "reviewer" },
          ["id"],
        )
        .then((rows: { id: string }[]) => rows[0]);
      const project = await db("projects")
        .insert({ name: "List Reviews Perm", root_path: `/tmp/lr-${u}`, created_by: owner.id }, ["id"])
        .then((rows: { id: string }[]) => rows[0]);
      await db("project_members").insert({
        project_id: project.id,
        user_id: owner.id,
        is_owner: true,
        role: "contributor",
      });
      await db("project_members").insert({
        project_id: project.id,
        user_id: viewerUser.id,
        is_owner: false,
        role: "viewer",
      });
      const photoStub = path.posix.join("photos", project.id, "bbbbbbbb-bbbb-bbbb-bbbbbbbbbbbb", "original.jpg");
      const photo = await db("photos")
        .insert(
          {
            project_id: project.id,
            original_path: photoStub,
            original_name: "x.jpg",
            status: "ready",
          },
          ["id"],
        )
        .then((rows: { id: string }[]) => rows[0]);
      const listRes = await app.inject({
        method: "GET",
        url: `/photo-reviews/photos/${photo.id}/reviews`,
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": viewerUser.id,
        },
      });
      expect(listRes.statusCode).toBe(403);
    } finally {
      await app.close();
    }
  });

  it("should return 404 for project mutations when user is not a member, 403 when member but not creator", async () => {
    const app = buildApp({ logger: false });
    await app.ready();
    try {
      const u = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const db = (app as any).db;
      const owner = await db("users")
        .insert(
          { email: `mut_owner_${u}@example.com`, name: "Mut Owner", password_hash: "h", role: "reviewer" },
          ["id"],
        )
        .then((rows: { id: string }[]) => rows[0]);
      const member = await db("users")
        .insert(
          { email: `mut_mem_${u}@example.com`, name: "Mut Member", password_hash: "h", role: "reviewer" },
          ["id"],
        )
        .then((rows: { id: string }[]) => rows[0]);
      const stranger = await db("users")
        .insert(
          { email: `mut_str_${u}@example.com`, name: "Mut Stranger", password_hash: "h", role: "reviewer" },
          ["id"],
        )
        .then((rows: { id: string }[]) => rows[0]);
      const project = await db("projects")
        .insert({ name: "Mutation Perm", root_path: `/tmp/mut-${u}`, created_by: owner.id }, ["id"])
        .then((rows: { id: string }[]) => rows[0]);
      await db("project_members").insert({
        project_id: project.id,
        user_id: owner.id,
        is_owner: true,
        role: "contributor",
      });
      await db("project_members").insert({
        project_id: project.id,
        user_id: member.id,
        is_owner: false,
        role: "reviewer",
      });

      const strangerPatch = await app.inject({
        method: "PATCH",
        url: `/projects/${project.id}`,
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": stranger.id,
        },
        payload: { name: "Nope" },
      });
      expect(strangerPatch.statusCode).toBe(404);

      const memberPatch = await app.inject({
        method: "PATCH",
        url: `/projects/${project.id}`,
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": member.id,
        },
        payload: { name: "Still nope" },
      });
      expect(memberPatch.statusCode).toBe(403);

      const fakeId = "00000000-0000-4000-8000-000000000001";
      const fakePatch = await app.inject({
        method: "PATCH",
        url: `/projects/${fakeId}`,
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": owner.id,
        },
        payload: { name: "Ghost" },
      });
      expect(fakePatch.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

});


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
          rootPath: "/tmp/project",
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
      expect(envelope.data.rootPath).toBe("/tmp/project");
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
      expect(envelope.data.rootPath.length).toBeGreaterThan(0);
      expect(envelope.data.rootPath).toContain(envelope.data.id);
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
          rootPath: "/tmp/metadata-project",
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
      await db("project_members").insert({ project_id: project.id, user_id: owner.id, is_owner: true });
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
      await db("project_members").insert({ project_id: project.id, user_id: owner.id, is_owner: true });
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
      await db("project_members").insert({ project_id: project.id, user_id: owner.id, is_owner: true });
      const insertedA = await db("photos").insert(
        {
          project_id: project.id,
          original_path: "/tmp/a.jpg",
          original_name: "a.jpg",
          status: "ready",
          preview_path: "preview.jpeg",
        },
        ["id"],
      );
      const insertedB = await db("photos").insert(
        {
          project_id: project.id,
          original_path: "/tmp/b.jpg",
          original_name: "b.jpg",
          status: "ready",
          preview_path: "preview.jpeg",
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
});


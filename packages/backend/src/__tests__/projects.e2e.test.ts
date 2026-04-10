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
});


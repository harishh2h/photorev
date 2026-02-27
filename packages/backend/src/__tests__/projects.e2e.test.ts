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
      const body = response.json() as {
        id: string;
        name: string;
        rootPath: string;
        createdBy: string;
      };
      expect(body.name).toBe("Test Project");
      expect(body.rootPath).toBe("/tmp/project");
      expect(body.createdBy).toBe(ownerId);

      const members = await (app as any)
        .db("project_members")
        .where({
          project_id: body.id,
          user_id: ownerId,
        });

      expect(members.length).toBe(1);
      expect(members[0].is_owner).toBe(true);
    } finally {
      await app.close();
    }
  });
});


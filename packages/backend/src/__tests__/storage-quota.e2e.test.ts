import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import buildApp from "../app";

const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

function buildMultipartBody(projectId: string): { payload: Buffer; boundary: string } {
  const boundary = "----photorev-quota-test";
  const parts = [
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="projectId"\r\n\r\n`,
    `${projectId}\r\n`,
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="file"; filename="test.jpg"\r\n`,
    `Content-Type: image/jpeg\r\n\r\n`,
  ];
  const tail = [`\r\n--${boundary}--\r\n`];
  const payload = Buffer.concat([
    Buffer.from(parts.join("")),
    JPEG_BYTES,
    Buffer.from(tail.join("")),
  ]);
  return { payload, boundary };
}

describe("storage quota upload enforcement", () => {
  let storageRoot = "";

  beforeEach(async () => {
    storageRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), "photorev-quota-e2e-"));
    process.env.STORAGE_ROOT = storageRoot;
  });

  afterEach(async () => {
    delete process.env.STORAGE_ROOT;
    if (storageRoot) {
      await fs.promises.rm(storageRoot, { recursive: true, force: true });
    }
  });

  it("rejects upload when project owner quota is full", async () => {
    const app = buildApp({ logger: false });
    await app.ready();

    try {
      const owner = await (app as any)
        .db("users")
        .insert(
          {
            email: `quota-owner-${Date.now()}@example.com`,
            name: "Quota Owner",
            password_hash: "hash",
            role: "user",
            quota_bytes: 0,
            quota_usage_bytes: 0,
          },
          ["id"],
        )
        .then((rows: { id: string }[]) => rows[0]);

      const projectRes = await app.inject({
        method: "POST",
        url: "/projects",
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": owner.id,
        },
        payload: { name: "Quota Project" },
      });
      expect(projectRes.statusCode).toBe(201);
      const projectId = (projectRes.json() as { data: { id: string } }).data.id;

      const { payload, boundary } = buildMultipartBody(projectId);
      const uploadRes = await app.inject({
        method: "POST",
        url: "/photos/upload",
        headers: {
          "x-test-bypass-auth": "1",
          "x-test-user-id": owner.id,
          "content-type": `multipart/form-data; boundary=${boundary}`,
        },
        payload,
      });

      expect(uploadRes.statusCode).toBe(413);
      const body = uploadRes.json() as {
        error: boolean;
        message: string;
        data: { code?: string };
      };
      expect(body.error).toBe(true);
      expect(body.data?.code).toBe("QUOTA_EXCEEDED");
    } finally {
      await app.close();
    }
  });
});

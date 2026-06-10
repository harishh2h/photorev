import { toClientErrorMessage } from "../utils/api-error";

describe("toClientErrorMessage", () => {
  it("uses postgres detail when present", () => {
    const err = Object.assign(new Error('duplicate key value violates unique constraint "users_email_key"'), {
      code: "23505",
      detail: 'Key (email)=(a@b.com) already exists.',
    });
    expect(toClientErrorMessage(err)).toBe("Key (email)=(a@b.com) already exists.");
  });

  it("maps known postgres codes without detail", () => {
    const err = Object.assign(new Error("duplicate key"), { code: "23505" });
    expect(toClientErrorMessage(err)).toBe("Record already exists");
  });

  it("simplifies verbose postgres messages", () => {
    const err = new Error(
      'insert into "photos" ("id") values ($1) - null value in column "project_id" violates not-null constraint',
    );
    expect(toClientErrorMessage(err)).toBe(
      'null value in column "project_id" violates not-null constraint',
    );
  });

  it("falls back for unknown errors", () => {
    expect(toClientErrorMessage(null, "Nope")).toBe("Nope");
  });
});

import { describe, expect, it } from "vitest";
import { removeTopLevel, setTopLevel, stripJsonComments, topLevelProperties } from "../lib/jsonc-edit.mjs";

const SAMPLE = `{
  // Worker name shown in the dashboard
  "name": "legacy-store",
  "main": "apps/worker/src/index.ts",
  /* The deploy script owns this binding. */
  "d1_databases": [
    {
      "binding": "DB", // keep the binding name
      "database_name": "legacy-store",
      "database_id": "3ee15198-1fe3-44e3-a20d-b4822f7065cc"
    }
  ],
  "vars": { "url": "https://example.com/a//b" }
}
`;

function parse(source) {
  return JSON.parse(stripJsonComments(source));
}

describe("jsonc-edit", () => {
  it("lists top-level properties and ignores comments and nested keys", () => {
    const keys = topLevelProperties(SAMPLE).map((property) => property.key);
    expect(keys).toEqual(["name", "main", "d1_databases", "vars"]);
  });

  it("replaces a string value without dropping comments", () => {
    const updated = setTopLevel(SAMPLE, "name", "cartbase");
    expect(updated).toContain("// Worker name shown in the dashboard");
    expect(updated).toContain("/* The deploy script owns this binding. */");
    expect(updated).toContain('"name": "cartbase"');
    expect(parse(updated).name).toBe("cartbase");
  });

  it("replaces a nested array value and keeps following properties intact", () => {
    const databases = [
      {
        binding: "DB",
        database_name: "cartbase",
        database_id: "00000000-0000-0000-0000-000000000000",
        migrations_dir: "migrations",
      },
    ];
    const updated = setTopLevel(SAMPLE, "d1_databases", databases);
    expect(updated).toContain("/* The deploy script owns this binding. */");
    expect(updated).toContain('"vars": { "url": "https://example.com/a//b" }');
    expect(parse(updated).d1_databases).toEqual(databases);
    expect(parse(updated).name).toBe("legacy-store");
  });

  it("inserts a missing property before the closing brace", () => {
    const updated = setTopLevel(SAMPLE, "observability", { enabled: true });
    expect(parse(updated).observability).toEqual({ enabled: true });
    expect(updated).toContain("// Worker name shown in the dashboard");
  });

  it("inserts into an empty object", () => {
    const updated = setTopLevel("{\n  // nothing yet\n}\n", "name", "cartbase");
    expect(parse(updated).name).toBe("cartbase");
    expect(updated).toContain("// nothing yet");
  });

  it("removes a middle property and its comma", () => {
    const updated = removeTopLevel(SAMPLE, "main");
    expect(updated).not.toContain("apps/worker/src/index.ts");
    expect(parse(updated)).toEqual({
      name: "legacy-store",
      d1_databases: parse(SAMPLE).d1_databases,
      vars: { url: "https://example.com/a//b" },
    });
    expect(updated).toContain("// Worker name shown in the dashboard");
  });

  it("removes the last property and the preceding comma", () => {
    const updated = removeTopLevel(SAMPLE, "vars");
    expect(parse(updated)).not.toHaveProperty("vars");
    expect(parse(updated).name).toBe("legacy-store");
  });

  it("is a no-op for an absent property", () => {
    expect(removeTopLevel(SAMPLE, "r2_buckets")).toBe(SAMPLE);
  });

  it("handles a comment after the last value", () => {
    const source = `{\n  "name": "legacy-store",\n  "d1_databases": [] // trailing\n}\n`;
    const updated = setTopLevel(source, "name", "cartbase");
    expect(parse(updated).name).toBe("cartbase");
    expect(parse(updated).d1_databases).toEqual([]);
    expect(updated).toContain("// trailing");
  });

  it("keeps comment-like text inside strings", () => {
    expect(stripJsonComments('{"a": "x//y", "b": "/*z*/"}')).toBe('{"a": "x//y", "b": "/*z*/"}');
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import { NetworkHelper } from "../src/models/NetworkHelper";

describe("NetworkHelper", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves parsed JSON responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ value: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(
      NetworkHelper.fetchOne("/api/test", (body) => body.value),
    ).resolves.toBe("ok");
  });

  it("rejects with the backend error message from JSON responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Das Passwort ist falsch." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(
      NetworkHelper.fetchOne("/api/test", (body) => body),
    ).rejects.toMatchObject({ status: 400, text: "Das Passwort ist falsch." });
  });

  it("rejects on invalid JSON success responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("not-json", {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        }),
      ),
    );

    await expect(
      NetworkHelper.fetchOne("/api/test", (body) => body),
    ).rejects.toMatchObject({
      status: 200,
      text: "Die Serverantwort enthält kein gültiges JSON.",
    });
  });

  it("rejects network failures instead of hanging", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("socket closed")),
    );

    await expect(
      NetworkHelper.fetchOne("/api/test", (body) => body),
    ).rejects.toMatchObject({ status: 0, text: "Die Anfrage an den Server ist fehlgeschlagen." });
  });
});

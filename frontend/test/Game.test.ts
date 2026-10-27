import { afterEach, describe, expect, it, vi } from "vitest";
import { Game } from "../src/models/Game";
import { Discipline } from "../src/models/Discipline";

const game = new Game("game-1", "Test Game", [], {} as Discipline);
afterEach(() => vi.unstubAllGlobals());

describe("game lifecycle requests", () => {
  it.each([
    ["delete", "DELETE", "/api/game/delete", { deleted_id: game.id }],
    ["leave", "POST", "/api/game/leave", { left_game_id: game.id }],
  ] as const)("%s sends the game ID and handles success", async (action, method, url, response) => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(response)));
    vi.stubGlobal("fetch", fetch);
    await expect(game[action]()).resolves.toBe(true);
    expect(fetch).toHaveBeenCalledWith(url, expect.objectContaining({
      method, body: JSON.stringify({ game_id: game.id }),
    }));
  });

  it.each(["delete", "leave"] as const)("%s propagates server errors", async (action) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: "Forbidden" }), { status: 403 },
    )));
    await expect(game[action]()).rejects.toMatchObject({ status: 403, text: "Forbidden" });
  });
});

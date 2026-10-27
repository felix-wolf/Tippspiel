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


describe("game settings requests", () => {
  const response = {
    id: game.id, name: "Updated", players: [], creator: { id: "owner", name: "Owner" },
    discipline: { id: "biathlon", name: "Biathlon", event_types: [] }, pw_set: true,
  };

  it.each([undefined, "  secret  "])("preserves optional password setup in the request", async (password) => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(response)));
    vi.stubGlobal("fetch", fetch);
    const updated = await game.saveSettings("Updated", password);
    expect(updated.hasPassword).toBe(true);
    expect(fetch).toHaveBeenCalledWith("/api/game/update", expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({ game_id: game.id, name: "Updated", ...(password === undefined ? {} : { password }) }),
    }));
  });

  it("propagates a password setup conflict", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: "Password already set" }), { status: 409 },
    )));
    await expect(game.saveSettings("Updated", "secret")).rejects.toMatchObject({ status: 409 });
  });

  it("sends a required creation password unchanged", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(response)));
    vi.stubGlobal("fetch", fetch);
    await Game.create("New Game", "biathlon", "  secret  ");
    expect(fetch).toHaveBeenCalledWith("/api/game", expect.objectContaining({
      method: "POST", body: JSON.stringify({ name: "New Game", password: "  secret  ", discipline: "biathlon" }),
    }));
  });
});

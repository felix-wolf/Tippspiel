import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SettingsModal } from "../src/components/domain/SettingsModal";
import { useCurrentUser } from "../src/contexts/UserContext";
import { Game } from "../src/models/Game";
import { User } from "../src/models/User";
import { Discipline } from "../src/models/Discipline";

vi.mock("../src/contexts/UserContext", () => ({ useCurrentUser: vi.fn() }));
vi.mock("../src/useFetch", () => ({ default: () => ({ data: {}, refetch: vi.fn() }) }));
vi.mock("../src/models/NotificationHelper", () => ({ NotificationHelper: {} }));
vi.mock("../src/components/domain/ColorUpdater", () => ({ ColorUpdater: () => null }));
vi.mock("../src/components/design/Dialog", () => ({
  DialogModal: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe("game settings permissions", () => {
  it.each([
    ["creator", true, false, true, true, false],
    ["admin outside game", false, true, false, true, false],
    ["admin member", false, true, true, true, true],
    ["ordinary member", false, false, true, false, true],
    ["outsider", false, false, false, false, false],
  ] as const)("shows permitted actions for %s", (_role, isCreator, isAdmin, isMember, canDelete, canLeave) => {
    const user = { id: "current", isAdmin } as User;
    vi.mocked(useCurrentUser).mockReturnValue(user);
    const game = new Game("game", "Saved Game Name", isMember ? [user] : [], {} as Discipline);
    const markup = renderToStaticMarkup(<SettingsModal
      isOpen isCreator={isCreator} game={game} onClose={vi.fn()}
      onGameDeleted={vi.fn()} onGameLeft={vi.fn()} onGameUpdated={vi.fn()}
    />);
    expect(markup.includes("Tippspiel löschen")).toBe(canDelete);
    expect(markup.includes("Tippspiel verlassen")).toBe(canLeave);
    expect(markup.includes("Name des Tippspiels")).toBe(isCreator);
    expect(markup.includes("Passwort festlegen")).toBe(isCreator);
    if (isCreator) expect(markup).toContain('type="password"');
  });
  it("does not offer password replacement for a protected game", () => {
    vi.mocked(useCurrentUser).mockReturnValue({ id: "owner", isAdmin: false } as User);
    const game = new Game("game", "Protected Game", [], {} as Discipline, undefined, true);
    const markup = renderToStaticMarkup(<SettingsModal
      isOpen isCreator game={game} onClose={vi.fn()}
      onGameDeleted={vi.fn()} onGameLeft={vi.fn()} onGameUpdated={vi.fn()}
    />);
    expect(markup).not.toContain("Passwort festlegen");
  });

});

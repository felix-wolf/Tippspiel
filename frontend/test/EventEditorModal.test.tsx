import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { EventEditorModal } from "../src/components/domain/EventEditorModal";
import { Game } from "../src/models/Game";
import { Discipline } from "../src/models/Discipline";
import { Event } from "../src/models/Event";

vi.mock("../src/components/design/Dialog", () => ({
  DialogModal: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock("../src/components/domain/ManualEventCreator", () => ({
  ManualEventCreator: () => <div>Custom event form</div>,
}));
vi.mock("../src/components/domain/OfficialEventImporter", () => ({
  OfficialEventImporter: () => <div>Official event importer</div>,
}));

function renderEditor({ canCreate = true, canManage = false, officialImport = false, event }: {
  canCreate?: boolean; canManage?: boolean; officialImport?: boolean; event?: Event;
} = {}) {
  const discipline = new Discipline("biathlon", "Biathlon", [], officialImport ? "official_api" : "manual", "manual");
  const game = new Game("game-1", "Game", [], discipline);
  return renderToStaticMarkup(<EventEditorModal
    game={game} types={[]} event={event} isOpen
    canCreateEvents={canCreate} canManageEventData={canManage} canImportEvents={officialImport}
    onClose={vi.fn()} onEventsChanged={vi.fn()}
  />);
}

describe("custom event creation permissions", () => {
  it("offers creators custom creation alongside the official importer", () => {
    const markup = renderEditor({ officialImport: true });
    expect(markup).toContain("Official event importer");
    expect(markup).toContain("Eigenes Event erstellen");
    expect(markup).not.toContain("Als Admin");
  });

  it("shows the custom form directly for a manual discipline", () => {
    expect(renderEditor()).toContain("Custom event form");
  });

  it("does not offer custom creation without permission", () => {
    expect(renderEditor({ canCreate: false })).not.toContain("Custom event form");
    expect(renderEditor({ canCreate: false, officialImport: true })).not.toContain("Eigenes Event erstellen");
  });

  it("does not grant creators access to editing existing events", () => {
    expect(renderEditor({ event: {} as Event })).not.toContain("Custom event form");
  });

  it("keeps existing event editing available to admins", () => {
    expect(renderEditor({ event: {} as Event, canManage: true, canCreate: false })).toContain("Custom event form");
  });
});

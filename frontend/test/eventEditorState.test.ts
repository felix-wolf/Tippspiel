import { describe, expect, it } from "vitest";

import {
  getEventEditorActionConfig,
  getEventEditorDialogType,
  getEventEditorTitle,
  getInitialEventEditorMode,
} from "../src/components/domain/eventEditorState";

describe("eventEditorState", () => {
  it("derives the initial mode from event presence and import capability", () => {
    expect(
      getInitialEventEditorMode({
        event: undefined,
        hasAutomaticImport: true,
      }),
    ).toBe("import_idle");

    expect(
      getInitialEventEditorMode({
        event: undefined,
        hasAutomaticImport: false,
      }),
    ).toBe("manual_create");

    expect(
      getInitialEventEditorMode({
        event: {} as any,
        hasAutomaticImport: true,
      }),
    ).toBe("manual_edit");
  });

  it("derives titles and dialog types from the current mode", () => {
    expect(getEventEditorTitle("manual_edit")).toBe("Event bearbeiten");
    expect(getEventEditorTitle("manual_create")).toBe("Events hinzufuegen");
    expect(getEventEditorDialogType("manual_edit")).toBe("edit");
    expect(getEventEditorDialogType("import_idle")).toBe("add");
  });

  it("derives action button state from the current mode", () => {
    expect(getEventEditorActionConfig("import_idle", 0)).toEqual({
      title: undefined,
      enabled: false,
    });
    expect(getEventEditorActionConfig("import_selecting", 0)).toEqual({
      title: "Importieren",
      enabled: false,
    });
    expect(getEventEditorActionConfig("import_selecting", 3)).toEqual({
      title: "3 Importieren",
      enabled: true,
    });
    expect(getEventEditorActionConfig("manual_create", 1)).toEqual({
      title: "Erstellen",
      enabled: true,
    });
    expect(getEventEditorActionConfig("manual_edit", 0)).toEqual({
      title: "Speichern",
      enabled: false,
    });
  });
});

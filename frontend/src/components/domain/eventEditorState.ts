import { Event } from "../../models/Event";

export type EventEditorMode =
  | "import_idle"
  | "import_selecting"
  | "manual_create"
  | "manual_edit";

export function getInitialEventEditorMode({
  event,
  hasAutomaticImport,
}: {
  event?: Event;
  hasAutomaticImport: boolean;
}): EventEditorMode {
  if (event) {
    return "manual_edit";
  }
  if (hasAutomaticImport) {
    return "import_idle";
  }
  return "manual_create";
}

export function getEventEditorTitle(mode: EventEditorMode): string {
  return mode === "manual_edit" ? "Event bearbeiten" : "Events hinzufuegen";
}

export function getEventEditorDialogType(mode: EventEditorMode): "add" | "edit" {
  return mode === "manual_edit" ? "edit" : "add";
}

export function getEventEditorActionConfig(
  mode: EventEditorMode,
  selectedEventCount: number,
): {
  title?: string;
  enabled: boolean;
} {
  switch (mode) {
    case "import_selecting":
      return {
        title: selectedEventCount > 0 ? `${selectedEventCount} Importieren` : "Importieren",
        enabled: selectedEventCount > 0,
      };
    case "manual_edit":
      return { title: "Speichern", enabled: selectedEventCount > 0 };
    case "manual_create":
      return { title: "Erstellen", enabled: selectedEventCount > 0 };
    case "import_idle":
    default:
      return { title: undefined, enabled: false };
  }
}

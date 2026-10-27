import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import CreateGameModal from "../src/components/domain/CreateGameModal";
import { GameCreator } from "../src/components/domain/GameCreator";

vi.mock("../src/components/design/Dialog", () => ({
  DialogModal: ({ children, actionButtonEnabled, onActionClick }: React.PropsWithChildren<{
    actionButtonEnabled: boolean; onActionClick: () => void;
  }>) => <><button disabled={!actionButtonEnabled} onClick={onActionClick}>Erstellen</button>{children}</>,
}));

describe("game creation password", () => {
  it("starts with creation disabled and a mandatory masked password field", () => {
    const onCreate = vi.fn();
    const markup = renderToStaticMarkup(<CreateGameModal isOpen onClose={vi.fn()} onCreate={onCreate} />);
    expect(markup).toContain('disabled=""');
    expect(markup).toContain('type="password"');
    expect(markup).toContain('placeholder="Passwort"');
    expect(markup).toContain('autoComplete="new-password"');
    expect(markup).not.toContain("optional");
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("renders password setup in the creation form", () => {
    const markup = renderToStaticMarkup(<GameCreator
      onSetName={vi.fn()} onSetPassword={vi.fn()} onSetDisciplineId={vi.fn()}
    />);
    expect(markup).toContain('type="password"');
  });
});

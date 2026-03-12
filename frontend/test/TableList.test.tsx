import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import TableList, { type TableColumn } from "../src/components/design/TableList";

type TableItem = {
  id: string;
  name: string;
  score: number;
};

const columns: TableColumn<TableItem>[] = [
  {
    id: "name",
    header: "Name",
    accessor: (item) => item.name,
  },
  {
    id: "score",
    header: "Punkte",
    align: "right",
    render: (item) => <strong>{item.score}</strong>,
  },
];

describe("TableList", () => {
  it("renders typed columns in the declared order", () => {
    const markup = renderToStaticMarkup(
      <TableList
        items={[{ id: "u1", name: "Alice", score: 12 }]}
        columns={columns}
        getRowKey={(item) => item.id}
      />,
    );

    expect(markup.indexOf("Name")).toBeLessThan(markup.indexOf("Punkte"));
    expect(markup).toContain("<td class=\"py-2 px-3 text-left\">Alice</td>");
    expect(markup).toContain("<strong>12</strong>");
  });

  it("adds row action affordances only when rows are clickable", () => {
    const clickableMarkup = renderToStaticMarkup(
      <TableList
        items={[{ id: "u1", name: "Alice", score: 12 }]}
        columns={columns}
        getRowKey={(item) => item.id}
        onRowClick={() => {}}
      />,
    );
    const staticMarkup = renderToStaticMarkup(
      <TableList
        items={[{ id: "u1", name: "Alice", score: 12 }]}
        columns={columns}
        getRowKey={(item) => item.id}
      />,
    );

    expect(clickableMarkup).toContain("role=\"button\"");
    expect(clickableMarkup).toContain("Aktion");
    expect(staticMarkup).not.toContain("role=\"button\"");
    expect(staticMarkup).not.toContain("Aktion");
  });
});

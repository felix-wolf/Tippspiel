import TableList, { type TableColumn } from "../../design/TableList";
import { Game } from "../../../models/Game";
import { EventScore } from "../../../models/EventScore";
import { Medal } from "lucide-react";

type ScoreListItem = {
  id: string;
  place: number;
  name: string;
  score: number;
};

type ScoreListProps = { game: Game; scores: EventScore[] };

const scoreColumns: TableColumn<ScoreListItem>[] = [
  { id: "place", header: "Platz", accessor: (item) => item.place },
  { id: "name", header: "Name", accessor: (item) => item.name },
  { id: "score", header: "Punkte", align: "right", accessor: (item) => item.score },
];

export function ScoreList({ game, scores }: ScoreListProps) {
  const items: ScoreListItem[] = game.players
    .map((player) => {
      const score = scores
        .map((e) => e.scores.get(player.id) ?? 0)
        .reduce((acc, curr) => (acc ?? 0) + (curr ?? 0), 0);
      return { id: player.id, name: player.name, score: score };
    })
    .sort((itemA, itemB) => itemB.score - itemA.score)
    .map((item, index) => {
      return { id: item.id, place: index + 1, name: item.name, score: item.score };
    });

  return (
    <TableList
      captionElement={<div className="flex flex-row gap-2"><Medal/><span className="font-bold">Punktestand</span></div>}
      items={items}
      columns={scoreColumns}
      getRowKey={(item) => item.id}
    />
  );
}

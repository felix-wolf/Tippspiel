import TableList from "../../design/TableList";
import { Game } from "../../../models/Game";
import { EventScore } from "../../../models/EventScore";
import { Medal } from "lucide-react";

type ScoreListItem = {
  place: number;
  name: string;
  score: number;
};

type ScoreListProps = { game: Game; scores: EventScore[] };

export function ScoreList({ game, scores }: ScoreListProps) {
  const items: ScoreListItem[] = game.players
    .map((player) => {
      const score = scores
        .map((e) => e.scores.get(player.id) ?? 0)
        .reduce((acc, curr) => (acc ?? 0) + (curr ?? 0), 0);
      return { name: player.name, score: score };
    })
    .sort((itemA, itemB) => itemB.score - itemA.score)
    .map((item, index) => {
      return { place: index + 1, name: item.name, score: item.score };
    });

  return (
    <TableList
      captionElement={<div className="flex flex-row gap-2"><Medal/><span className="font-bold">Punktestand</span></div>}
      items={items}
      headers={{ place: "Platz", name: "Name", score: "Punkte" }}
      customRenderers={{}}
      displayNextArrow={false}
      cellHeight={"short"}
    />
  );
}

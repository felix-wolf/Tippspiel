import TableList from "../../design/TableList";
import { Game } from "../../../models/Game";
import { EventScore } from "../../../models/EventScore";

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
        .reduce((acc, curr) => (acc ?? 0) + (curr ?? 0));
      return { name: player.name, score: score };
    })
    .sort((itemA, itemB) => itemB.score - itemA.score)
    .map((item, index) => {
      return { place: index + 1, name: item.name, score: item.score };
    });

  return (
    <TableList
      items={items}
      headers={{ place: "Platz", name: "Name", score: "Punkte" }}
      customRenderers={{}}
      caption={"Punktestand"}
      displayNextArrow={false}
      cellHeight={"short"}
    />
  );
}

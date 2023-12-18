import TableList from "../../design/TableList";
import { Game } from "../../../models/Game";
import { Event } from "../../../models/Event";
import { Bet } from "../../../models/Bet";
import { User } from "../../../models/user/User";

type ScoreListItem = {
  place: number;
  name: string;
  score: number;
};

type ScoreListProps = { game: Game; events: Event[] };

export function ScoreList({ game, events }: ScoreListProps) {
  function getPlayerBet(player: User, bets: Bet[]): Bet | undefined {
    return bets.find((bet) => bet.user_id == player.id);
  }

  const items: ScoreListItem[] = game.players
    .map((player) => {
      const score = events
        .map((e) => getPlayerBet(player, e.bets)?.score ?? 0)
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

import { List } from "../../design/List";
import { Bet } from "../../../models/Bet";
import { Event } from "../../../models/Event";
import { useEffect, useState } from "react";
import styles from "./BetList.module.scss";
import TableList from "../../design/TableList";
import { Game } from "../../../models/Game";

type BetItemProp = {
  playerName: string;
  bet: Bet | undefined;
};

type BetResultItem = {
  tipp: string;
  result: number | undefined;
  score: number | undefined;
};

function BetItem({ playerName, bet }: BetItemProp) {
  const [resultItems, setResultItems] = useState<BetResultItem[]>([]);

  useEffect(() => {
    setResultItems(
      bet?.predictions.map((pred) => {
        return {
          tipp: `${pred.predicted_place ?? -1}: ${
            pred.object_name ?? "unknown"
          }`,
          result: pred.actual_place,
          score: pred.score,
        };
      }) ?? [],
    );
  }, [bet]);

  function getScoreText(bet: Bet | undefined) {
    if (!bet) {
      return "nicht getippt";
    }
    if (bet?.hasPredictions() && !bet.hasResults()) {
      return "Ergebnis ausstehend";
    }
    return `Score: ${bet.score}`;
  }

  return (
    <div className={styles.container}>
      <div className={styles.name}>{playerName}</div>
      {resultItems.length > 0 && (
        <TableList
          cellHeight={"short"}
          items={resultItems}
          headers={{
            tipp: "Tipp",
            result: bet?.hasResults() ? "Ergebnis" : "",
            score: bet?.hasResults() ? "Punkte" : "",
          }}
          customRenderers={{}}
          displayNextArrow={false}
        />
      )}
      <div className={styles.score}>{getScoreText(bet)}</div>
    </div>
  );
}

type BetItem = {
  playerName: string;
  bet?: Bet;
};

type BetListProps = {
  game: Game;
  event: Event;
};

export function BetList({ game, event }: BetListProps) {
  const [items, setItems] = useState<BetItem[]>();

  useEffect(() => {
    const betsOfPlayers: BetItem[] =
      game?.players.map((player) => {
        const playerBet = event.bets.find((bet) => bet.user_id == player.id);
        return {
          playerName: player.name,
          bet: playerBet,
        };
      }) ?? [];
    setItems(
      betsOfPlayers.sort((a, b) => {
        if (a.bet && !b.bet) return -1; // one bet is not defined
        if (!a.bet && b.bet) return 1; // one bet is not defined
        if (!a.bet && !b.bet) return a.playerName.localeCompare(b.playerName); // both bets not defined
        if (
          (a.bet?.score == undefined && b.bet?.score == undefined) ||
          a.bet?.score == b.bet?.score
        )
          // bets defined but not evaluated
          return a.playerName.localeCompare(b.playerName);
        return (b.bet?.score ?? 0) - (a.bet?.score ?? 0);
      }),
    );
  }, [event]);

  return (
    <List
      title={"Tipps"}
      displayBorder={false}
      items={
        items?.map((bet, index) => (
          <BetItem
            key={`${bet}_${index}`}
            playerName={bet.playerName}
            bet={bet.bet}
          />
        )) ?? []
      }
      max_height={6000}
      align={"center"}
    />
  );
}

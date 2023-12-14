import { SiteRoutes, usePathParams } from "../../SiteRoutes";
import { useEffect, useState } from "react";
import { Event } from "../models/Event";
import { NavPage } from "./NavPage";
import { List } from "../components/design/List";
import styles from "./ViewBetsPage.module.scss";
import { Bet } from "../models/Bet";
import { Game } from "../models/Game";
import TableList from "../components/design/TableList";

type BetItemProp = {
  playerName: string;
  bet: Bet | undefined;
};

type BetResultItem = {
  tipp: string;
  result: number;
  score: number;
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
          result: pred.actual_place ?? -1,
          score: pred.score ?? 0,
        };
      }) ?? [],
    );
  }, [bet]);

  return (
    <div className={styles.container}>
      <div className={styles.name}>{playerName}</div>
      <div className={styles.predictions}>
        <TableList
          cellHeight={"short"}
          items={resultItems}
          headers={{
            tipp: "Tipp",
            result: "Ergebnis",
            score: "Punkte",
          }}
          customRenderers={{}}
          displayNextArrow={false}
        />
      </div>
      <div className={styles.score}>Score: {bet?.score}</div>
    </div>
  );
}

type BetItem = {
  playerName: string;
  bet?: Bet;
};

export function ViewBetsPage() {
  const [event, setEvent] = useState<Event | undefined>(undefined);
  const { event_id, game_id } = usePathParams(SiteRoutes.ViewBets);
  const [items, setItems] = useState<BetItem[]>();

  useEffect(() => {
    Game.fetchOne(game_id)
      .then((game) => {
        Event.fetchOne(event_id)
          .then((event) => {
            setEvent(event);
            const betsOfPlayers: BetItem[] = game.players.map((player) => {
              const playerBet = event.bets.find(
                (bet) => bet.user_id == player.id,
              );
              return {
                playerName: player.name,
                bet: playerBet,
              };
            });
            setItems(
              betsOfPlayers.sort(
                (a, b) => (a.bet?.score ?? 0) - (b.bet?.score ?? 0),
              ),
            );
          })
          .catch((error) => {
            console.log("error fetching event", error);
          });
      })
      .catch((error) => console.log(error));
  }, [event_id, game_id]);

  return (
    <NavPage title={"Tipps von Event: " + event?.name}>
      <List
        title={"Tipps"}
        items={
          items?.map((bet, index) => (
            <BetItem
              key={`${bet}_${index}`}
              playerName={bet.playerName}
              bet={bet.bet}
            />
          )) ?? []
        }
        max_height={600}
      />
    </NavPage>
  );
}

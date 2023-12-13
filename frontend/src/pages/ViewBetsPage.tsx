import { SiteRoutes, usePathParams } from "../../SiteRoutes";
import { useEffect, useState } from "react";
import { Event } from "../models/Event";
import { NavPage } from "./NavPage";
import { List } from "../components/design/List";
import styles from "./ViewBetsPage.module.scss";
import { Bet } from "../models/Bet";
import { Game } from "../models/Game";
import { EventType } from "../models/user/EventType";
import { BetInputItem } from "../components/design/BetInput";
import { Country } from "../models/Country";
import { Athlete } from "../models/Athlete";

type BetItemProp = {
  playerName: string;
  bet: Bet | undefined;
  eventType?: EventType;
};

function BetItem({ playerName, bet, eventType }: BetItemProp) {
  const [predictionObjects, setPredictionObjects] = useState<BetInputItem[]>();

  useEffect(() => {
    switch (eventType?.betting_on) {
      case "countries":
        Country.fetchAll()
          .then((countries) => {
            setPredictionObjects(
              filterPredictionObjects(
                countries.map((country) => country.toBetInputItem()),
              ),
            );
          })
          .catch((error) => {
            console.log(error);
          });
        break;
      case "athletes": {
        const desiredType = eventType.name == "men" ? "m" : "f";
        Athlete.fetchAll()
          .then((athletes) => {
            const a = athletes.filter(
              (athletes) => athletes.gender == desiredType,
            );
            setPredictionObjects(
              filterPredictionObjects(
                a.map((athlete) => athlete.toBetInputItem()),
              ),
            );
          })
          .catch((error) => {
            console.log(error);
          });
      }
    }
  }, []);

  function filterPredictionObjects(objects: BetInputItem[]): BetInputItem[] {
    return objects.filter(
      (object) =>
        bet?.predictions.map((p) => p.object_id).indexOf(object.id ?? "") !==
        -1,
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.name}>{playerName}</div>
      <div className={styles.predictions}>
        {predictionObjects?.map((prediction, index) => (
          <div key={prediction.id}>
            {index + 1}: {prediction.name}
          </div>
        ))}
      </div>
      <div>Score: {bet?.score}</div>
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
              eventType={event?.type}
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

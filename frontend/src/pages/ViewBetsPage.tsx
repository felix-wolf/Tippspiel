import { SiteRoutes, usePathParams } from "../../SiteRoutes";
import { useEffect, useState } from "react";
import { Event } from "../models/Event";
import { NavPage } from "./NavPage";
import { List } from "../components/design/List";
import styles from "./ViewBetsPage.module.scss";
import { Bet } from "../models/Bet";

type BetItemProp = {
  bet: Bet;
};

function BetItem({ bet }: BetItemProp) {
  return (
    <div className={styles.container}>
      <span>{bet.id}</span>
    </div>
  );
}

export function ViewBetsPage() {
  const [event, setEvent] = useState<Event | undefined>(undefined);
  const { event_id, game_id } = usePathParams(SiteRoutes.ViewBets);

  useEffect(() => {
    Event.fetchOne(event_id)
      .then((event) => {
        setEvent(event);
      })
      .catch((error) => {
        console.log("error fetching event", error);
      });
  }, [event_id, game_id]);

  return (
    <NavPage title={"Tipps von Event: " + event?.name}>
      <List
        title={"Tipps"}
        items={event?.bets?.map((bet) => <BetItem bet={bet} />) ?? []}
      />
    </NavPage>
  );
}

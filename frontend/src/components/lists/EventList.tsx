import { useEffect } from "react";
import { Game } from "../../models/Game";
import { Event } from "../../models/Event";
import styles from "./EventList.module.scss";

type EventListProps = {
  type: "upcoming" | "past";
  game?: Game;
};

export function EventList({ type, game }: EventListProps) {
  useEffect(() => {
    if (game?.id)
      Event.fetchAll(game.id).then((events) => {
        console.log(events);
      });
  }, [type, game]);

  return (
    <div>
      <div className={styles.heading}>
        {type == "upcoming" ? "Anstehende " : "Vergangene "}
        Events
      </div>
    </div>
  );
}

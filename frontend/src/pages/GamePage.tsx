import { SiteRoutes, usePathParams } from "../../SiteRoutes";
import { useEffect, useState } from "react";
import { Game } from "../models/Game";
import styles from "./GamePage.module.scss";
import { EventCreator } from "../components/EventCreator";
import { EventList } from "../components/lists/EventList";
import { User } from "../models/user/User";

export function GamePage() {
  const { game_id } = usePathParams(SiteRoutes.Game);
  const [game, setGame] = useState<Game | undefined>(undefined);

  useEffect(() => {
    Game.fetchOne(game_id)
      .then((game) => {
        if (game) setGame(game);
      })
      .catch((error) => console.log(error));
  }, [game_id]);
  return (
    <>
      <div className={styles.headline}>{game?.name}</div>
      {game?.creator?.id == user?.id && <EventCreator />}
      <EventList type={"upcoming"} game={game} />
      <EventList type={"past"} game={game} />
    </>
  );
}

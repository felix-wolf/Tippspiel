import { SiteRoutes, usePathParams } from "../../SiteRoutes";
import { useEffect, useState } from "react";
import { Game } from "../models/Game";
import styles from "./GamePage.module.scss";
import { Events } from "../components/Events";

export function GamePage() {
  const { game_id } = usePathParams(SiteRoutes.Game);
  const [game, setGame] = useState<Game | undefined>(undefined);

  useEffect(() => {
    Game.fetchOne(game_id)
      .then((game) => setGame(game))
      .catch((error) => console.log(error));
  }, [game_id]);
  return (
    <>
      <div className={styles.headline}>{game?.name}</div>
      <Events game={game} />
    </>
  );
}

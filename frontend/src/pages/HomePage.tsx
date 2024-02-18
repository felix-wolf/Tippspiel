import { BettingGameList } from "../components/domain/lists/BettingGameList";
import { useCurrentUser, useLogout } from "../models/user/UserContext";
import { Button } from "../components/design/Button";
import styles from "./HomePage.module.scss";
import { useCallback, useEffect, useState } from "react";
import { SiteRoutes, useNavigateParams } from "../../SiteRoutes";
import { GamesContext } from "../contexts/GameContext";
import { Game } from "../models/Game";

export function HomePage() {
  const logout = useLogout();
  const navigate = useNavigateParams();
  const user = useCurrentUser();
  const [games, setGames] = useState<Game[]>();

  useEffect(() => {
    Game.fetchAll().then((fetchedGames) => {
      setGames(fetchedGames);
    });
  }, []);

  const logoutClick = useCallback(() => {
    logout().then();
    navigate(SiteRoutes.Login, {});
  }, []);

  return (
    <div className={styles.container}>
      <h3>Hallo {user?.name}!</h3>
      <GamesContext.Provider value={games}>
        <BettingGameList user={user} show_games={"user"} />
        <BettingGameList user={user} show_games={"other"} />
      </GamesContext.Provider>
      <Button onClick={logoutClick} title={"Logout"} type={"negative"} />
    </div>
  );
}

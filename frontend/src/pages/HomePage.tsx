import { BettingGameList } from "../components/domain/lists/BettingGameList";
import { useCurrentUser, useLogout } from "../models/user/UserContext";
import { Button } from "../components/design/Button";
import styles from "./HomePage.module.scss";
import { useCallback } from "react";
import { SiteRoutes, useNavigateParams } from "../../SiteRoutes";
import { GamesContext } from "../contexts/GameContext";
import { Game } from "../models/Game";
import useFetch from "../useFetch";
import { useCache } from "../contexts/CacheContext";
import Loader from "../components/design/Loader";

export function HomePage() {
  const logout = useLogout();
  const navigate = useNavigateParams();
  const user = useCurrentUser();
  const { setCache } = useCache();

  const { loading, data } = useFetch<Game[]>({
    func: Game.fetchAll,
    args: [],
    key: "games",
  });

  if (data) {
    data.forEach((game: Game) =>
      setCache(Game.buildCacheKey(game.id), game, 2 * 60),
    );
  }

  const logoutClick = useCallback(() => {
    logout().then();
    navigate(SiteRoutes.Login, {});
  }, []);

  return (
    <div className={styles.container}>
      <h3>Hallo {user?.name}!</h3>
      {loading && <Loader />}
      {!loading && (
        <GamesContext.Provider value={data}>
          <BettingGameList user={user} show_games={"user"} />
          <BettingGameList user={user} show_games={"other"} />
        </GamesContext.Provider>
      )}
      <Button onClick={logoutClick} title={"Logout"} type={"negative"} />
    </div>
  );
}

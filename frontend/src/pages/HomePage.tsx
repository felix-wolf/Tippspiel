import { BettingGameList } from "../components/domain/lists/BettingGameList";
import { useCurrentUser, useLogout } from "../models/user/UserContext";
import { Button } from "../components/design/Button";
import styles from "./HomePage.module.scss";
import { useCallback } from "react";
import { SiteRoutes, useNavigateParams } from "../../SiteRoutes";
import { GamesContext } from "../contexts/GameContext";
import { Game } from "../models/Game";
import useFetch from "../useFetch";
import { PulseLoader } from "react-spinners";
import { useCache } from "../contexts/CacheContext";

export function HomePage() {
  const logout = useLogout();
  const navigate = useNavigateParams();
  const user = useCurrentUser();
  const { setCache } = useCache();

  const { loading, data } = useFetch<Game[]>({
    fetchFunction: Game.fetchAll,
    cache: { enabled: true, ttl: 60 * 2 },
    key: "games",
  });

  if (data) {
    data.forEach((game: Game) => setCache(`game${game.id}`, game, 2 * 60));
  }

  const logoutClick = useCallback(() => {
    logout().then();
    navigate(SiteRoutes.Login, {});
  }, []);

  return (
    <div className={styles.container}>
      <h3>Hallo {user?.name}!</h3>
      {loading && <PulseLoader />}
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

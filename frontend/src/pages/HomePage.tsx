import { BettingGameList } from "../components/domain/lists/BettingGameList";
import { useCurrentUser, useLogout } from "../models/user/UserContext";
import { Button } from "../components/design/Button";
import { useCallback } from "react";
import { SiteRoutes, useNavigateParams } from "../../SiteRoutes";
import { GamesContext } from "../contexts/GameContext";
import { Game } from "../models/Game";
import useFetch from "../useFetch";
import { useCache } from "../contexts/CacheContext";
import Loader from "../components/design/Loader";
import { useAppearance } from "../contexts/AppearanceContext.tsx";
import { motion } from "motion/react";

export function HomePage() {
  const logout = useLogout();
  const navigate = useNavigateParams();
  const user = useCurrentUser();

  const { setCache } = useCache();
  const { appearance } = useAppearance();

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
  console.log(data?.filter((game) => game.players.some((p) => p.id == user?.id)))
  return (
    <>
      {/* Header */}
      <header className="flex justify-between items-center w-full max-w-5xl mb-10">
        <h1 className="text-2xl font-semibold text-gray-800">
          Hallo <span className="text-sky-700">{user?.name}</span>!
        </h1>
        <div className="w-50">
          <Button title="Logout" onClick={logoutClick} type="negative" />
        </div>
      </header>

      {loading && <Loader />}
      {!loading && (
        <GamesContext.Provider value={data}>
          <BettingGameList user={user} show_games={"user"} />
          <BettingGameList user={user} show_games={"other"} />
        </GamesContext.Provider>
      )}
    </>
  );
}

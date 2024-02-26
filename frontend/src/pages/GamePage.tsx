import { SiteRoutes, useNavigateParams, usePathParams } from "../../SiteRoutes";
import { useCallback, useEffect, useState } from "react";
import { Game } from "../models/Game";
import { EventList } from "../components/domain/lists/EventList";
import { useCurrentUser } from "../models/user/UserContext";
import { NavPage } from "./NavPage";
import styles from "./GamePage.module.scss";
import { ScoreLine } from "../components/domain/ScoreLine";
import { ColorUpdater } from "../components/domain/ColorUpdater";
import { Toggler } from "../components/design/Toggler";
import { ScoreList } from "../components/domain/lists/ScoreList";
import useFetch from "../useFetch";
import Loader from "../components/design/Loader";
import { EventScore } from "../models/EventScore";

export function GamePage() {
  const { game_id } = usePathParams(SiteRoutes.Game);
  const navigate = useNavigateParams();
  const [isCreator, setIsCreator] = useState(false);
  const user = useCurrentUser();

  const gameFetchValues = useFetch<Game>({
    key: Game.buildCacheKey(game_id),
    func: Game.fetchOne,
    args: [game_id],
  });

  const scoreFetchValues = useFetch<EventScore[]>({
    key: EventScore.buildCacheKey(game_id),
    func: EventScore.fetchAll,
    args: [game_id],
  });

  const {
    data: game,
    refetch: refetchGame,
    loading: gameLoading,
  } = gameFetchValues;

  const { data: scores } = scoreFetchValues;

  useEffect(() => {
    if (!user) {
      navigate(SiteRoutes.Login, {});
    }
    setIsCreator(game?.creator?.id == user?.id);
  }, [user, game]);

  const showUserBets = useCallback(
    (event_id: string) => {
      navigate(SiteRoutes.PlaceBet, { game_id, event_id });
    },
    [game_id],
  );

  const showAllBets = useCallback(
    (event_id: string) => {
      navigate(SiteRoutes.ViewBets, { game_id, event_id });
    },
    [game_id],
  );

  return (
    <NavPage title={game?.name}>
      {gameLoading && <Loader />}
      {!gameLoading && (
        <>
          <div className={styles.punkte}>
            {user && game && scores && (
              <>
                <Toggler
                  items={[
                    {
                      name: "Graph",
                      component: (
                        <>
                          <ColorUpdater
                            user={user}
                            onUpdated={() => {
                              refetchGame(true);
                              //refetchEvents(true);
                            }}
                          />
                          <ScoreLine game={game} scores={scores} />
                        </>
                      ),
                    },
                    {
                      name: "Tabelle",
                      component: <ScoreList game={game} scores={scores} />,
                    },
                  ]}
                />
              </>
            )}
          </div>
        </>
      )}
      {game && (
        <>
          <div className={styles.listContainer}>
            <EventList
              game={game}
              type={"upcoming"}
              placeholderWhenEmpty={
                <div className={styles.empty_text}>
                  Es sind noch keine Events eingetragen...
                </div>
              }
              showUserBets={showUserBets}
              isCreator={isCreator}
            />
          </div>
          <div className={styles.listContainer}>
            <EventList
              game={game}
              type={"past"}
              placeholderWhenEmpty={
                <div className={styles.empty_text}>Es gab noch keine...</div>
              }
              showAllBets={showAllBets}
            />
          </div>
        </>
      )}
    </NavPage>
  );
}

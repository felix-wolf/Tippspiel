import { SiteRoutes, useNavigateParams, usePathParams } from "../../SiteRoutes";
import { useCallback, useEffect, useState } from "react";
import { Game } from "../models/Game";
import { EventCreator } from "../components/domain/EventCreator";
import { EventList } from "../components/domain/lists/EventList";
import { useCurrentUser } from "../models/user/UserContext";
import { NavPage } from "./NavPage";
import { Event } from "../models/Event";
import { EventType } from "../models/user/EventType";
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
  const [refetch, setRefetch] = useState(false);

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

  const onCreate = useCallback(
    (type: EventType, name: string, datetime: Date): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        Event.create(name, game_id, type, datetime)
          .then((_) => {
            setRefetch(true);
            setRefetch(false);
            //refetchEvents(true);
            resolve(true);
          })
          .catch((error) => {
            reject();
            console.log(error);
          });
      });
    },
    [game_id],
  );

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
      {isCreator && (
        <EventCreator
          onClick={onCreate}
          types={game?.discipline.eventTypes ?? []}
        />
      )}
      {game && (
        <>
          <div className={styles.listContainer}>
            <EventList
              game={game}
              refresh={refetch}
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
              refresh={refetch}
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

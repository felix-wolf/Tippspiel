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
import { EventEditorModal } from "../components/domain/EventEditorModal";
import useFetch from "../useFetch";
import { useCache } from "../contexts/CacheContext";
import Loader from "../components/design/Loader";

export function GamePage() {
  const { game_id } = usePathParams(SiteRoutes.Game);
  const navigate = useNavigateParams();
  const [isCreator, setIsCreator] = useState(false);
  const [eventEditId, setEventEditId] = useState<string | undefined>(undefined);
  const user = useCurrentUser();
  const { setCache } = useCache();
  const [editorKey, setEditorKey] = useState(0);

  const sortEvents = (date_a: Event, date_b: Event): number =>
    date_a.datetime.getTime() - date_b.datetime.getTime();

  const gameFetchValues = useFetch<Game>({
    key: Game.buildCacheKey(game_id),
    fetchFunction: Game.fetchOne,
    functionArgs: game_id,
  });

  const eventsFetchValues = useFetch<Event[]>({
    key: Event.buildListCacheKey(game_id),
    fetchFunction: Event.fetchAll,
    functionArgs: game_id,
  });

  const {
    data: events,
    refetch: refetchEvents,
    loading: eventsLoading,
  } = eventsFetchValues;

  const {
    data: game,
    refetch: refetchGame,
    loading: gameLoading,
  } = gameFetchValues;

  let upcomingEvents: Event[] = [];
  let pastEvents: Event[] = [];

  if (events) {
    pastEvents = events
      .filter((event) => event.datetime < new Date())
      .sort((a, b) => sortEvents(a, b) * -1);
    upcomingEvents = events
      .filter(
        (event) => !pastEvents?.find((past_event) => past_event.id == event.id),
      )
      .sort(sortEvents);
  }

  pastEvents
    .slice(0, 3)
    .concat(upcomingEvents.slice(0, 3))
    .forEach((event) => setCache(`event${event.id}`, event, 2 * 60));

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
            refetchEvents(true);
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
          <EventEditorModal
            key={editorKey}
            isOpened={eventEditId != undefined}
            types={game?.discipline.eventTypes}
            onEdited={() => {
              setEventEditId(undefined);
              refetchEvents(true);
            }}
            onCancel={() => {
              setEventEditId(undefined);
              setEditorKey(editorKey + 1);
            }}
            event={upcomingEvents.find((e) => e.id == eventEditId)}
          />
          <div className={styles.punkte}>
            {pastEvents.length > 0 && user && game && (
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
                              refetchEvents(true);
                            }}
                          />
                          <ScoreLine game={game} events={[...pastEvents]} />
                        </>
                      ),
                    },
                    {
                      name: "Tabelle",
                      component: <ScoreList game={game} events={pastEvents} />,
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
      {eventsLoading && <Loader />}
      {!eventsLoading && (
        <>
          <div className={styles.listContainer}>
            <EventList
              events={upcomingEvents}
              type={"upcoming"}
              placeholderWhenEmpty={
                <div className={styles.empty_text}>
                  Es sind noch keine Events eingetragen...
                </div>
              }
              showUserBets={showUserBets}
              isCreator={isCreator}
              onEdit={(event_id) => setEventEditId(event_id)}
            />
          </div>
          <div className={styles.listContainer}>
            <EventList
              events={pastEvents}
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

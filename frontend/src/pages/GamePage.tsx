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

export function GamePage() {
  const { game_id } = usePathParams(SiteRoutes.Game);
  const navigate = useNavigateParams();
  const [game, setGame] = useState<Game | undefined>(undefined);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [isCreator, setIsCreator] = useState(false);
  const [eventEditId, setEventEditId] = useState<string | undefined>(undefined);
  const user = useCurrentUser();
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate(SiteRoutes.Login, {});
    }
    setIsCreator(game?.creator?.id == user?.id);
  }, [user, game]);

  const fetchGame = useCallback(() => {
    Game.fetchOne(game_id)
      .then((game) => {
        setGame(game);
      })
      .catch((error) => console.log(error));
  }, [game_id]);

  const fetchEvents = useCallback(() => {
    Event.fetchAll(game_id)
      .then((events) => {
        const past = events
          .filter((event) => event.datetime < new Date())
          .sort((a, b) => sortEvents(a, b) * -1);
        const upcoming = events
          .filter(
            (event) => !past.find((past_event) => past_event.id == event.id),
          )
          .sort(sortEvents);
        setPastEvents(past);
        setUpcomingEvents(upcoming);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [game_id]);

  useEffect(() => {
    fetchGame();
    fetchEvents();
  }, []);

  const sortEvents = (date_a: Event, date_b: Event): number =>
    date_a.datetime.getTime() - date_b.datetime.getTime();

  const onCreate = useCallback(
    (type: EventType, name: string, datetime: Date): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        Event.create(name, game_id, type, datetime)
          .then((_) => {
            fetchEvents();
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
      <EventEditorModal
        key={editorKey}
        isOpened={eventEditId != undefined}
        types={game?.discipline.eventTypes}
        onEdited={() => {
          setEventEditId(undefined);
          fetchEvents();
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
                          fetchGame();
                          fetchEvents();
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
      {isCreator && (
        <EventCreator
          onClick={onCreate}
          types={game?.discipline.eventTypes ?? []}
        />
      )}
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
    </NavPage>
  );
}

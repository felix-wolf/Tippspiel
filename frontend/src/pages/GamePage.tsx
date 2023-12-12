import { SiteRoutes, useNavigateParams, usePathParams } from "../../SiteRoutes";
import { useCallback, useEffect, useState } from "react";
import { Game } from "../models/Game";
import { EventCreator } from "../components/domain/EventCreator";
import { EventList } from "../components/domain/lists/EventList";
import { useCurrentUser } from "../models/user/UserContext";
import { NavPage } from "./NavPage";
import { Event } from "../models/Event";
import { EventType } from "../models/user/EventType";

export function GamePage() {
  const { game_id } = usePathParams(SiteRoutes.Game);
  const navigate = useNavigateParams();
  const [game, setGame] = useState<Game | undefined>(undefined);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const u = useCurrentUser();
    if (!u) {
      navigate(SiteRoutes.Login, {});
    }
    setIsCreator(game?.creator?.id == u?.id);
  }, [game]);

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
        const past = events.filter((event) => event.datetime < new Date());
        const upcoming = events.filter(
          (event) => !past.find((past_event) => past_event.id == event.id),
        );
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
  }, [game_id]);

  const onCreate = useCallback(
    (type: EventType, name: string, datetime: Date) => {
      Event.create(name, game_id, type, datetime)
        .then((event) => {
          fetchEvents();
        })
        .catch((error) => {
          console.log(error);
        });
    },
    [game_id],
  );

  const onEventClicked = useCallback(
    (event_id: string) => {
      navigate(SiteRoutes.Bet, { game_id, event_id });
    },
    [game_id],
  );

  return (
    <NavPage title={game?.name}>
      {isCreator && (
        <EventCreator
          onClick={onCreate}
          types={game?.discipline.eventTypes ?? []}
        />
      )}
      <EventList
        events={upcomingEvents}
        type={"upcoming"}
        emptyButton={
          isCreator && (
            <EventCreator
              onClick={onCreate}
              types={game?.discipline.eventTypes ?? []}
            />
          )
        }
        onEventClicked={onEventClicked}
      />
      <EventList events={pastEvents} type={"past"} />
    </NavPage>
  );
}

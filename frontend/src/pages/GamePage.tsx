import { SiteRoutes, useNavigateParams, usePathParams } from "../../SiteRoutes";
import { useCallback, useEffect, useState } from "react";
import { Game } from "../models/Game";
import { EventCreator } from "../components/domain/EventCreator";
import { EventList } from "../components/domain/lists/EventList";
import { User } from "../models/user/User";
import { useCurrentUser } from "../models/user/UserContext";
import { NavPage } from "./NavPage";
import { Event, EventType } from "../models/Event";

export function GamePage() {
  const { game_id } = usePathParams(SiteRoutes.Game);
  const navigate = useNavigateParams();
  const [game, setGame] = useState<Game | undefined>(undefined);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const u = useCurrentUser();
    if (!u) {
      navigate(SiteRoutes.Login, {});
    }
    setUser(u);
    setIsCreator(game?.creator?.id == user?.id);
  }, [game]);

  const fetchGame = useCallback(() => {
    Game.fetchOne(game_id)
      .then((game) => {
        if (game) setGame(game);
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
          console.log(event);
          fetchEvents();
        })
        .catch((error) => {
          console.log(error);
        });
    },
    [game_id],
  );

  return (
    <NavPage title={game?.name}>
      {isCreator && (
        <EventCreator onClick={onCreate} types={["relay", "men", "women"]} />
      )}
      <EventList
        events={upcomingEvents}
        type={"upcoming"}
        game={game}
        emptyButton={
          isCreator && (
            <EventCreator
              onClick={onCreate}
              types={["relay", "men", "women"]}
            />
          )
        }
      />
      <EventList events={pastEvents} type={"past"} game={game} />
    </NavPage>
  );
}

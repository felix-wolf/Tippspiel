import { NavPage } from "./NavPage";
import { useEffect, useState } from "react";
import { Event } from "../models/Event";
import { SiteRoutes, usePathParams } from "../../SiteRoutes";
import { Country } from "../models/Country";
import { Athlete } from "../models/Athlete";
import { EventType } from "../models/user/EventType";
import { useCurrentUser } from "../models/user/UserContext";
import { BetInput } from "../components/design/BetInput";
import styles from "./PlaceBetPage.module.scss";

type Place = {
  id: string;
};

type Placements = { places: Place[] };

export function PlaceBetPage() {
  const [options, setOptions] = useState<Record<string, string>[]>([]);
  const { event_id, game_id } = usePathParams(SiteRoutes.Bet);
  const user = useCurrentUser();
  const [bet, setBet] = useState<Placements>();
  const [event, setEvent] = useState<Event | undefined>(undefined);
  useEffect(() => {
    Event.fetchOne(event_id)
      .then((event) => {
        const userBet = event.bets.find((bet) => bet.user_id == user?.id);
        if (userBet) {
          setBet({
            places: userBet.placements.map((placement): Place => {
              return {
                id: placement.object_id,
              };
            }),
          });
        } else {
          setBet({
            places: Array.from({ length: 5 }).map((_, index) => {
              return {
                id: index.toString(),
              };
            }),
          });
          console.log(bet);
        }
        //setOptions(userBets);
        setEvent(event);
        loadData(event.type);
      })
      .catch((error) => {
        console.log("error fetching event", error);
      });
  }, [event_id, game_id]);

  function loadData(eventType: EventType): void {
    switch (eventType.betting_on) {
      case "countries":
        Country.fetchAll()
          .then((countries) => {
            console.log(countries);
            setOptions(countries.map((country) => country.toRecord()));
          })
          .catch((error) => {
            console.log(error);
          });
        break;
      case "athletes": {
        const desiredType = eventType.name == "men" ? "m" : "f";
        Athlete.fetchAll()
          .then((athletes) => {
            const a = athletes.filter(
              (athletes) => athletes.gender == desiredType,
            );
            const records = a.map((athlete) => athlete.toRecord());
            setOptions(records);
          })
          .catch((error) => {
            console.log(error);
          });
      }
    }
  }

  return (
    <NavPage title={"TIPPEN FÜR: " + event?.name}>
      <div className={styles.container}>
        {bet?.places.map((_, index) => (
          <BetInput key={index} place={index + 1} />
        ))}
      </div>
    </NavPage>
  );
}

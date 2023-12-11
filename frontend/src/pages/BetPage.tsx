import { NavPage } from "./NavPage";
import { useEffect, useState } from "react";
import { Event } from "../models/Event";
import { SiteRoutes, usePathParams } from "../../SiteRoutes";
import { Country } from "../models/Country";
import { Athlete } from "../models/Athlete";
import { EventType } from "../models/user/EventType";

export function BetPage() {
  const [options, setOptions] = useState<Record<string, string>[]>([]);
  const { event_id, game_id } = usePathParams(SiteRoutes.Bet);
  const [event, setEvent] = useState<Event | undefined>(undefined);
  useEffect(() => {
    Event.fetchOne(event_id)
      .then((event) => {
        setEvent(event);
        loadData(event.type);
      })
      .catch((error) => {
        console.log("error fetching event", error);
      });
  }, [event_id, game_id]);

  function loadData(eventType: EventType): void {
    switch (eventType.betting_on) {
      case "relay":
        Country.fetchAll()
          .then((countries) => {
            console.log(countries);
          })
          .catch((error) => {
            console.log(error);
          });
        break;
      default: {
        const desiredType = eventType.betting_on == "men" ? "m" : "f";
        Athlete.fetchAll()
          .then((athletes) => {
            const a = athletes.filter(
              (athletes) => athletes.gender == desiredType,
            );
            const records = a.map((athlete) => athlete.toRecord());
            setOptions(records);
            console.log(records);
          })
          .catch((error) => {
            console.log(error);
          });
      }
    }
  }

  return <NavPage title={"TIPPEN FÜR: " + event?.name}></NavPage>;
}

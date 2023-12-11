import { NavPage } from "./NavPage";
import { useCallback, useEffect, useState } from "react";
import { Event } from "../models/Event";
import { SiteRoutes, usePathParams } from "../../SiteRoutes";
import { Country } from "../models/Country";
import { Athlete } from "../models/Athlete";
import { EventType } from "../models/user/EventType";
import { useCurrentUser } from "../models/user/UserContext";
import { BetInput, BetInputItem } from "../components/design/BetInput";
import { Button } from "../components/design/Button";

export function PlaceBetPage() {
  const [items, setItems] = useState<BetInputItem[]>([]);
  const [placedBets, setPlacedBets] = useState<BetInputItem[]>([]);
  const { event_id, game_id } = usePathParams(SiteRoutes.Bet);
  const user = useCurrentUser();
  const [event, setEvent] = useState<Event | undefined>(undefined);
  const [completed, setCompleted] = useState(false);
  const betId: string | undefined = undefined;

  useEffect(() => {
    Event.fetchOne(event_id)
      .then((event) => {
        setEvent(event);
        loadData(event.type)
          .then((items) => {
            setItems(items);
            const userBet = event.bets.find((bet) => bet.user_id == user?.id);
            if (userBet) {
              betId = userBet.user_id;
              const selected = items.filter((item) => {
                userBet.placements
                  .map((p) => p.object_id)
                  .indexOf(item.id ?? "");
              });
              setPlacedBets(selected);
            } else {
              const new_bets: [
                BetInputItem,
                BetInputItem,
                BetInputItem,
                BetInputItem,
                BetInputItem,
              ] = [
                { id: undefined, name: "" },
                { id: undefined, name: "" },
                { id: undefined, name: "" },
                { id: undefined, name: "" },
                { id: undefined, name: "" },
              ];
              setPlacedBets(new_bets);
            }
          })
          .catch((error) => console.log(error));
      })
      .catch((error) => {
        console.log("error fetching event", error);
      });
  }, [event_id, game_id]);

  const onSelectItem = useCallback(
    (item: BetInputItem, place: number) => {
      const bets = [...placedBets];
      bets[place - 1] = item;
      setPlacedBets(bets);
      calcCompleted();
    },
    [placedBets],
  );

  function loadData(eventType: EventType): Promise<BetInputItem[]> {
    return new Promise((resolve, reject) => {
      switch (eventType.betting_on) {
        case "countries":
          Country.fetchAll()
            .then((countries) => {
              resolve(countries.map((country) => country.toBetInputItem()));
            })
            .catch((error) => {
              reject(error);
            });
          break;
        case "athletes": {
          const desiredType = eventType.name == "men" ? "m" : "f";
          Athlete.fetchAll()
            .then((athletes) => {
              const a = athletes.filter(
                (athletes) => athletes.gender == desiredType,
              );
              resolve(a.map((athlete) => athlete.toBetInputItem()));
            })
            .catch((error) => {
              reject(error);
            });
        }
      }
    });
  }

  const calcCompleted = useCallback(() => {
    setCompleted(placedBets.filter((bet) => bet.id).length == 5);
  }, [placedBets]);

  const onSave = useCallback(() => {
    Bet;
  }, [placedBets]);

  return (
    <NavPage title={"TIPPEN FÜR: " + event?.name}>
      <div>
        {placedBets?.map((item, index) => (
          <BetInput
            key={index}
            place={index + 1}
            items={items}
            prev_selected={item}
            onSelect={onSelectItem}
          />
        ))}
        {placedBets.length == 0 &&
          Array.from({ length: 5 }).map((_, index) => (
            <BetInput
              key={index}
              place={index + 1}
              items={items}
              onSelect={onSelectItem}
            />
          ))}
      </div>
      {completed && (
        <Button onClick={onSave} title={"Speichern"} type={"positive"} />
      )}
    </NavPage>
  );
}

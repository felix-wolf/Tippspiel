import { NavPage } from "./NavPage";
import { useCallback, useEffect, useState } from "react";
import { Bets, Event } from "../models/Event";
import { SiteRoutes, usePathParams } from "../../SiteRoutes";
import { Country } from "../models/Country";
import { Athlete } from "../models/Athlete";
import { EventType } from "../models/user/EventType";
import { useCurrentUser } from "../models/user/UserContext";
import { BetInput, BetInputItem } from "../components/design/BetInput";
import { Button } from "../components/design/Button";
import { Bet } from "../models/Bet";
import { useNavigate } from "react-router-dom";

export function PlaceBetPage() {
  const [items, setItems] = useState<BetInputItem[]>([]);
  const [placedBets, setPlacedBets] = useState<BetInputItem[]>([]);
  // TODO: this is only needed because of enter bug, fix it
  const [newBets, setNewBets] = useState<BetInputItem[]>([]);
  const { event_id, game_id } = usePathParams(SiteRoutes.Bet);
  const user = useCurrentUser();
  const [event, setEvent] = useState<Event | undefined>(undefined);
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Event.fetchOne(event_id)
      .then((event) => {
        setEvent(event);
        loadData(event.type)
          .then((items) => {
            setItems(items);
            const userBets =
              event?.bets?.filter((bet) => bet.user_id == user?.id) ??
              undefined;
            console.log(userBets);
            if (userBets && userBets.length == 5) {
              const selected = items.filter((item) => {
                return (
                  userBets.map((p) => p.object_id).indexOf(item.id ?? "") != -1
                );
              });
              selected.sort(
                (a, b) =>
                  userBets.map((p) => p.object_id).indexOf(a.id ?? "") -
                  userBets.map((p) => p.object_id).indexOf(b.id ?? ""),
              );
              setPlacedBets(selected);
              setNewBets(selected);
              calcCompleted(selected);
            } else {
              const new_bets: [
                BetInputItem,
                BetInputItem,
                BetInputItem,
                BetInputItem,
                BetInputItem,
              ] = [
                { id: undefined, flag: "", name: "" },
                { id: undefined, flag: "", name: "" },
                { id: undefined, flag: "", name: "" },
                { id: undefined, flag: "", name: "" },
                { id: undefined, flag: "", name: "" },
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
      const bets = [...newBets];
      bets[place - 1] = item;
      setNewBets(bets);
      calcCompleted(bets);
    },
    [newBets],
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

  const calcCompleted = useCallback((bets: BetInputItem[]) => {
    console.log(
      "completed",
      bets.filter((bet) => bet.id).length == 5,
      bets.filter((bet) => bet.id),
    );
    setCompleted(bets.filter((bet) => bet.id).length == 5);
  }, []);

  const onSave = useCallback(() => {
    const existing_ids = placedBets.map((bet) => bet.id);
    const bets = newBets.map((bet, index) => {
      return new Bet(
        existing_ids && existing_ids.length == 5
          ? existing_ids[index]
          : undefined,
        user?.id!,
        index + 1,
        bet.id!,
        undefined,
        undefined,
      );
    });
    if (bets.length == 5 && user?.id) {
      Event.saveBets(event_id, user.id, bets as Bets)
        .then((event) => {
          navigate(-1);
        })
        .catch((error) => console.log("error saving bets", error));
    }
  }, [newBets]);

  return (
    <NavPage title={"TIPPEN FÜR: " + event?.name}>
      <div>
        {placedBets?.map((item, index) => (
          <BetInput
            key={index}
            place={index + 1}
            items={items
              .filter
              //(i) => placedBets.map((i) => i.id).indexOf(i.id) != -1,
              ()}
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

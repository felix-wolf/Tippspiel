import { NavPage } from "./NavPage";
import { useCallback, useEffect, useState } from "react";
import { Event, Predictions } from "../models/Event";
import { SiteRoutes, usePathParams } from "../../SiteRoutes";
import { Country } from "../models/Country";
import { Athlete } from "../models/Athlete";
import { EventType } from "../models/user/EventType";
import { useCurrentUser } from "../models/user/UserContext";
import { BetInput, BetInputItem } from "../components/design/BetInput";
import { Button } from "../components/design/Button";
import { Bet, Prediction } from "../models/Bet";
import { useNavigate } from "react-router-dom";
import styles from "./PlaceBetPage.module.scss";

export function PlaceBetPage() {
  const [items, setItems] = useState<BetInputItem[]>([]);
  const [placedPredictions, setPlacedPredictions] = useState<BetInputItem[]>(
    [],
  );
  const { event_id, game_id } = usePathParams(SiteRoutes.PlaceBet);
  const user = useCurrentUser();
  const [event, setEvent] = useState<Event | undefined>(undefined);
  const [completed, setCompleted] = useState(false);
  const [userBet, setUserBet] = useState<Bet | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    Event.fetchOne(event_id)
      .then((event) => {
        setEvent(event);
        loadData(event.type)
          .then((items) => {
            setItems(items);
            const betOfUser =
              event?.bets?.find((bet) => bet.user_id == user?.id) ?? undefined;
            setUserBet(betOfUser);
            loadPredictions(betOfUser, items);
          })
          .catch((error) => console.log(error));
      })
      .catch((error) => {
        console.log("error fetching event", error);
      });
  }, [event_id, game_id]);

  const loadPredictions = useCallback(
    (userBet: Bet | undefined, items: BetInputItem[]) => {
      if (userBet && userBet.predictions.length == 5) {
        const selected = items.filter((item) => {
          return (
            userBet.predictions
              .map((p) => p.object_id)
              .indexOf(item.id ?? "") != -1
          );
        });
        selected.sort(
          (a, b) =>
            userBet.predictions.map((p) => p.object_id).indexOf(a.id ?? "") -
            userBet.predictions.map((p) => p.object_id).indexOf(b.id ?? ""),
        );
        setPlacedPredictions(selected);
        calcCompleted(selected);
      } else {
        const new_bets = [
          { id: undefined, name: "" },
          { id: undefined, name: "" },
          { id: undefined, name: "" },
          { id: undefined, name: "" },
          { id: undefined, name: "" },
        ];
        setPlacedPredictions(new_bets);
      }
    },
    [],
  );

  const onSelectItem = useCallback(
    (item: BetInputItem, place: number) => {
      const bets = [...placedPredictions];
      bets.forEach((bet, index, array) => {
        if (bet.id == item.id) array[index] = { id: "", name: "" };
      });
      bets[place - 1] = item;
      setPlacedPredictions(bets);
      calcCompleted(bets);
    },
    [placedPredictions],
  );

  const onClear = useCallback(() => {
    setCompleted(false);
  }, []);

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
    setCompleted(bets.filter((bet) => bet.id).length == 5);
  }, []);

  const onSave = useCallback(() => {
    const predictions = placedPredictions.map((bet_item, index) => {
      return new Prediction(
        undefined,
        userBet?.id,
        index + 1,
        bet_item.id!,
        undefined,
        undefined,
        undefined,
      );
    });
    if (predictions.length == 5 && user?.id) {
      Event.saveBets(event_id, user.id, predictions as Predictions)
        .then((_) => {
          navigate(-1);
        })
        .catch((error) => console.log("error saving bets", error));
    }
  }, [placedPredictions, userBet]);

  return (
    <NavPage title={"TIPPEN FÜR: " + event?.name}>
      <form
        className={styles.container}
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        {placedPredictions?.map((item, index) => (
          <BetInput
            key={`${index} ${item.id} ${item.name}`}
            place={index + 1}
            items={items}
            prev_selected={item}
            onSelect={onSelectItem}
            onClear={onClear}
          />
        ))}
        {placedPredictions.length == 0 &&
          Array.from({ length: 5 }).map((_, index) => (
            <BetInput
              key={index}
              place={index + 1}
              items={items}
              onSelect={onSelectItem}
              onClear={onClear}
            />
          ))}

        {completed && (
          <Button onClick={onSave} title={"Speichern"} type={"positive"} />
        )}
      </form>
    </NavPage>
  );
}

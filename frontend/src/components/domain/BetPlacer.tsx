import { useCallback, useEffect, useState } from "react";
import { Bet, Prediction } from "../../models/Bet";
import { BetInput, BetInputItem } from "../design/BetInput";
import styles from "./BetPlacer.module.scss";
import { Button } from "../design/Button";
import { Event } from "../../models/Event";
import { EventType } from "../../models/user/EventType";
import { Country } from "../../models/Country";
import { Athlete } from "../../models/Athlete";
import { User } from "../../models/user/User";

type BetPlacerProps = {
  onSave: (selectedItems: Prediction[]) => void;
  event: Event;
  tryLoadExistingBet?: boolean;
  user?: User;
  saveEnabled?: boolean;
  enteringResults: boolean;
};
export function BetPlacer({
  event,
  onSave: _onSave,
  user,
  tryLoadExistingBet = true,
  saveEnabled = true,
  enteringResults,
}: BetPlacerProps) {
  const [placedPredictions, setPlacedPredictions] = useState<BetInputItem[]>(
    [],
  );
  const [completed, setCompleted] = useState(false);
  const [items, setItems] = useState<BetInputItem[]>([]);
  const [userBet, setUserBet] = useState<Bet | undefined>(undefined);
  let selectionsNeeded = 10;
  if (tryLoadExistingBet || event) {
    if (event.allowPartialPoints && enteringResults) {
      selectionsNeeded = event.numBets * 2;
    } else {
      selectionsNeeded = event.numBets;
    }
  }

  useEffect(() => {
    loadData(event.type)
      .then((items) => {
        setItems(items);
        const betOfUser =
          event?.bets?.find((bet) => bet.user_id == user?.id) ?? undefined;
        setUserBet(betOfUser);
        loadPredictions(userBet, items);
      })
      .catch((error) => console.log(error));
  }, [event, userBet, user]);

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
                (athlete) =>
                  athlete.gender == desiredType &&
                  athlete.discipline == event.type.discipline_id,
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

  function loadPredictions(userBet: Bet | undefined, items: BetInputItem[]) {
    if (
      tryLoadExistingBet &&
      userBet &&
      userBet.predictions.length == event.numBets
    ) {
      const selected = items.filter((item) => {
        return (
          userBet.predictions.map((p) => p.object_id).indexOf(item.id ?? "") !=
          -1
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
      const new_bets = new Array(selectionsNeeded)
        .fill(0)
        .map((_): BetInputItem => {
          return { id: undefined, name: "" };
        });
      setPlacedPredictions(new_bets);
    }
  }

  function calcCompleted(bets: BetInputItem[]) {
    const equal = bets
      .map((bet, index) => bet.id == userBet?.predictions[index].object_id)
      .every((eq) => eq);
    setCompleted(
      bets.filter((bet) => bet.id).length == selectionsNeeded && !equal,
    );
  }

  const onSelectItem = useCallback(
    (item: BetInputItem, place: number) => {
      // if the selected item is elsewhere selected, we deselected at the other place
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
    _onSave(predictions);
  }, [placedPredictions, userBet]);

  return (
    <form
      className="backdrop-blur-md bg-white/40 border border-white/40 shadow-xl rounded-3xl px-4 sm:px-8 py-6 space-y-6 w-full max-w-6xl"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      {placedPredictions?.map((item, index) => (
        <BetInput
          key={`${index} ${item.id} ${item.name}`}
          place={index + 1}
          items={items}
          totalNumOfInputs={selectionsNeeded}
          prev_selected={item}
          onSelect={onSelectItem}
          onClear={() => setCompleted(false)}
        />
      ))}
      {placedPredictions.length == 0 &&
        Array.from({ length: selectionsNeeded }).map((_, index) => (
          <BetInput
            key={index}
            place={index + 1}
            items={items}
            totalNumOfInputs={selectionsNeeded}
            onSelect={onSelectItem}
            onClear={() => setCompleted(false)}
          />
        ))}

      <Button
        isEnabled={completed && saveEnabled}
        onClick={onSave}
        title={"Speichern"}
        type={"positive"}
      />
    </form>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bet, Prediction } from "../../models/Bet";
import { BetInput, BetInputItem } from "../design/BetInput";
import { Button } from "../design/Button";
import { Event } from "../../models/Event";
import { EventType } from "../../models/EventType";
import { Country } from "../../models/Country";
import { Athlete } from "../../models/Athlete";
import { User } from "../../models/User";

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
  const [startList, setStartList] = useState<string[] | undefined>(undefined);
  const [invalidPredictions, setInvalidPredictions] = useState<number[]>([]);
  const [userBet, setUserBet] = useState<Bet | undefined>(undefined);
  let selectionsNeeded = 10;
  if (tryLoadExistingBet || event) {
    if (event.allowPartialPoints && enteringResults) {
      selectionsNeeded = event.numBets * 2;
    } else {
      selectionsNeeded = event.numBets;
    }
  }

  const filteredItems = useMemo(() => {
    if (!startList || startList.length === 0) return items;
    return items.filter((item) => startList.includes(item.id ?? ""));
  }, [items, startList]);

  useEffect(() => {
    Event.fetchStartList(event.id)
      .then((list) => setStartList(list))
      .catch(() => setStartList(undefined));
  }, [event.id]);

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
    const allSelected = bets.filter((bet) => bet.id).length == selectionsNeeded;
    const equal = bets
      .map((bet, index) => bet.id == userBet?.predictions[index].object_id)
      .every((eq) => eq);

    const invalid = [];
    if (startList && startList.length > 0) {
      bets.forEach((bet, index) => {
        if (bet.id && !startList.includes(bet.id)) {
          invalid.push(index + 1);
        }
      });
    }
    setInvalidPredictions(invalid);

    setCompleted(allSelected && !equal && invalid.length === 0);
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
    [placedPredictions, startList, userBet, selectionsNeeded],
  );

  const onSave = useCallback(() => {
    const predictions = placedPredictions.map((bet_item, index) => {
      return new Prediction(
        undefined,
        userBet?.id,
        index + 1,
        bet_item.id!,
        bet_item.name,
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
      <div className="space-y-1">
        <p className="text-sm text-slate-700">
          Wähle deine Top-{placedPredictions.length} für dieses Rennen. Je genauer dein Tipp, desto mehr Punkte bekommst du.
        </p>
        {startList && startList.length > 0 && (
          <p className="text-xs text-sky-700 font-medium">
            ✓ Startliste geladen ({startList.length} Teilnehmer)
          </p>
        )}
        {invalidPredictions.length > 0 && (
          <p className="text-xs text-red-600 font-semibold">
            ⚠ Position {invalidPredictions.join(", ")} steht nicht auf der Startliste.
          </p>
        )}
      </div>

      {placedPredictions?.map((item, index) => (
        <BetInput
          key={`${index} ${item.id} ${item.name}`}
          place={index + 1}
          items={filteredItems}
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
            items={filteredItems}
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

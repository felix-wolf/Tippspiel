import { useCallback, useEffect, useMemo, useState } from "react";
import { Bet, Prediction } from "../../models/Bet";
import { BetInput, BetInputItem } from "../design/BetInput";
import { Button } from "../design/Button";
import { Event, StartListEntry } from "../../models/Event";
import { EventType } from "../../models/EventType";
import { Country } from "../../models/Country";
import { Athlete } from "../../models/Athlete";
import { User } from "../../models/User";
import { ChevronDown, ChevronRight } from "lucide-react";

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
  const [startListEntries, setStartListEntries] = useState<StartListEntry[]>([]);
  const [invalidPredictions, setInvalidPredictions] = useState<number[]>([]);
  const [userBet, setUserBet] = useState<Bet | undefined>(undefined);
  const [startListCollapsed, setStartListCollapsed] = useState(true);
  let selectionsNeeded = 10;
  if (tryLoadExistingBet || event) {
    if (event.allowPartialPoints && enteringResults) {
      selectionsNeeded = event.numBets * 2;
    } else {
      selectionsNeeded = event.numBets;
    }
  }
  // we enrich the start list with the item name for better display in the start list overview
  const enrichedStartList = useMemo(() => {
    if (!startList || startList.length === 0) return [];
    return startList.map((item) => items.find((i) => i.id === item) ?? { id: item, name: item });
  }, [startList, items]);
  const displayStartListEntries = useMemo(() => {
    if (startListEntries.length > 0) {
      return startListEntries;
    }
    return enrichedStartList.map((item) => ({
      id: item.id ?? item.name,
      name: item.name,
      members: [],
    }));
  }, [enrichedStartList, startListEntries]);

  // if a start list is available, we filter the items to those in the start list, otherwise we show all items
  const filteredItems = useMemo(() => {
    if (!startList || startList.length === 0) return items;
    return items.filter((item) => startList.includes(item.id ?? ""));
  }, [items, startList]);
  const startListEntityLabel = event.type.betting_on === "countries" ? "Länder" : "Athleten";

  useEffect(() => {
    Event.fetchStartList(event.id)
      .then((response) => {
        setStartList(response.startList);
        setStartListEntries(response.entries);
      })
      .catch(() => {
        setStartList(undefined);
        setStartListEntries([]);
      });
  }, [event.id]);

  useEffect(() => {
    setStartListCollapsed(true);
  }, [event.id, event.type.betting_on]);

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

    const invalid: number[] = [];
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
          <div className="mt-2 rounded-lg border border-sky-200 bg-sky-50/50 p-2">
            <button
              type="button"
              className="flex w-full items-center gap-2 text-left text-xs font-medium text-sky-700"
              onClick={() => setStartListCollapsed(!startListCollapsed)}
            >
              {startListCollapsed ? (
                <ChevronRight size={14} className="text-sky-500" />
              ) : (
                <ChevronDown size={14} className="text-sky-500" />
              )}
              <span>
                ✓ Startliste geladen ({filteredItems.length} {startListEntityLabel})
                {startListCollapsed && "- zum Ausklappen klicken"}
              </span>
            </button>
            {!startListCollapsed && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded bg-white/60 p-2 text-xs text-slate-600">
                <p className="mb-2 font-medium text-slate-700">Alle startenden {startListEntityLabel}</p>
                <div className="columns-2 gap-1">
                  {displayStartListEntries.map((item, index) => (
                    <div
                      key={item.id}
                      className="mb-1 block break-inside-avoid rounded bg-sky-100 px-1.5 py-1 text-slate-700"
                    >
                      <span className="block font-medium">
                        {index + 1}. {item.name}
                      </span>
                      {item.members.length > 0 && (
                        <span className="mt-0.5 block text-[11px] text-slate-600">
                          {item.members
                            .map((member) =>
                              member.leg ? `${member.leg}. ${member.name}` : member.name,
                            )
                            .join(" | ")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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

import React, { useCallback, useEffect, useState } from "react";
import { Event } from "../../../models/Event";
import TableList from "../../design/TableList";
import { Button } from "../../design/Button";
import styles from "./EventList.module.scss";
import { useCurrentUser } from "../../../models/user/UserContext";
import edit from "../../../assets/icons/edit.svg";
import { Utils } from "../../../utils";
import useFetch from "../../../useFetch";
import { EventEditorModal } from "../EventEditorModal";
import { Game } from "../../../models/Game";
import { Toggler, TogglerItem } from "../../design/Toggler";

export type EventTimeType = "upcoming" | "past";

type EventListType = {
  id: string;
  name: string;
  datetime: string;
  betsButton: undefined;
  editButton: undefined;
  hasBetForUser: boolean;
  hasBets: boolean;
  type: EventTimeType;
};

type EventListProps = {
  type: EventTimeType;
  game: Game;
  placeholderWhenEmpty?: React.ReactNode;
  showUserBets?: (event_id: string) => void;
  showAllBets?: (event_id: string) => void;
  isCreator?: boolean;
  refresh: boolean;
};

export function EventList({
  type,
  game,
  placeholderWhenEmpty,
  showUserBets: _showUserBets,
  showAllBets: _showAllBets,
  isCreator = false,
  refresh,
}: EventListProps) {
  const user = useCurrentUser();
  const [eventEditId, setEventEditId] = useState<string | undefined>(undefined);
  const [editorKey, setEditorKey] = useState(0);
  const [currPage, setCurrPage] = useState(1);

  let fetchArgs: any[] = [game.id];
  if (type == "past") {
    fetchArgs = fetchArgs.concat([currPage, true]);
  }

  useEffect(() => {
    refetch();
  }, [currPage]);

  const eventsFetchValues = useFetch<Event[]>({
    key: Event.buildListCacheKey(game.id) + currPage,
    func: Event.fetchAll,
    args: fetchArgs,
    initialEnabled: false,
  });

  const { data: events, refetch, loading } = eventsFetchValues;

  if (refresh) refetch(true);

  if (type == "upcoming")
    events?.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

  function dateToString(date: Date): string {
    return `${getDoubleDigit(date.getDate().toString())}.${getDoubleDigit(
      (date.getMonth() + 1).toString(),
    )}.${date.getFullYear()} - ${Utils.getTimeString(date)}`;
  }

  function getPageItems(currPage: number): TogglerItem[] {
    let items: TogglerItem[] = [];
    if (currPage == 1) {
      items = items.concat({ name: "Alle" });
    }
    if (currPage > 1) {
      items = items.concat({ name: "<" });
    }
    if (currPage > 0) {
      items = items.concat({
        name: currPage.toString(),
        highlight: false,
      });
    }
    if ((events?.length ?? 0) == 5 || currPage == 0) {
      items = items.concat({ name: ">" });
    }
    return items;
  }

  function getDoubleDigit(digits: string): string {
    if (digits.length == 2) return digits;
    return "0" + digits;
  }

  const getTitle = useCallback(
    (event: EventListType): string => {
      if (type == "upcoming") {
        if (event.hasBetForUser) {
          return "bearbeiten";
        } else {
          return "machen";
        }
      } else {
        return "ansehen";
      }
    },
    [type, events],
  );

  function getButtonType(
    event: EventListType,
  ): "positive" | "negative" | "neutral" {
    if (event.hasBetForUser) return "neutral";
    if (event.hasBets && type == "past") return "neutral";
    return "positive";
  }

  return (
    <>
      <EventEditorModal
        key={editorKey}
        isOpened={eventEditId != undefined}
        types={game?.discipline.eventTypes}
        onEdited={() => {
          setEventEditId(undefined);
          refetch(true);
        }}
        onCancel={() => {
          setEventEditId(undefined);
          setEditorKey(editorKey + 1);
        }}
        event={events?.find((e) => e.id == eventEditId)}
      />
      <div className={styles.heading}>
        {type == "upcoming" ? "Anstehende Events" : "Vergangene Events"}
      </div>
      {events && events.length == 0 && placeholderWhenEmpty}
      {events && events.length != 0 && (
        <>
          <TableList
            alignLastRight={isCreator}
            displayNextArrow={false}
            items={events.map((item): EventListType => {
              return {
                id: item.id,
                name: item.name,
                datetime: dateToString(item.datetime),
                betsButton: undefined,
                editButton: undefined,
                hasBetForUser:
                  item
                    .hasBetsForUsers()
                    .find((user_id) => user_id == user?.id) != undefined,
                hasBets: item.hasBetsForUsers().length > 0,
                type: item.datetime < new Date() ? "past" : "upcoming",
              };
            })}
            headers={{
              name: "Name",
              datetime: "Zeit",
              betsButton: "Tipps...",
              editButton: "",
            }}
            customRenderers={{
              betsButton: (it) =>
                (it.type == "upcoming" || it.hasBets) && (
                  <div style={{ width: 100 }}>
                    <Button
                      onClick={() => {
                        if (it.type == "upcoming" && _showUserBets)
                          _showUserBets(it.id);
                        if (it.type == "past" && _showAllBets)
                          _showAllBets(it.id);
                      }}
                      type={getButtonType(it)}
                      title={getTitle(it)}
                      width={"flexible"}
                      height={"flexible"}
                    />
                  </div>
                ),
              editButton: (it) =>
                it.type == "upcoming" &&
                isCreator && (
                  <div className={styles.editContainer}>
                    <Button
                      type={"clear"}
                      width={"flexible"}
                      icon={edit}
                      title={""}
                      onClick={() => {
                        setEventEditId(it.id);
                      }}
                    />
                  </div>
                ),
            }}
          />
          {type == "past" && !loading && (
            <Toggler
              highlight={false}
              items={getPageItems(currPage)}
              didSelect={(item) => {
                switch (item.name) {
                  case "Alle":
                  case "<":
                    setCurrPage(currPage - 1);
                    break;
                  case ">":
                    setCurrPage(currPage + 1);
                    break;
                  default:
                    break;
                }
              }}
            />
          )}
        </>
      )}
    </>
  );
}

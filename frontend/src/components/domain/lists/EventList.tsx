import React, { useCallback, useEffect, useState } from "react";
import { Event } from "../../../models/Event";
import TableList from "../../design/TableList";
import { Button } from "../../design/Button";
import styles from "./EventList.module.scss";
import { useCurrentUser } from "../../../models/user/UserContext";
import edit_white from "../../../assets/icons/edit_white.svg";
import edit_black from "../../../assets/icons/edit_black.svg";
import { Utils } from "../../../utils";
import useFetch from "../../../useFetch";
import { EventEditorModal } from "../EventEditorModal";
import { Game } from "../../../models/Game";
import { Toggler, TogglerItem } from "../../design/Toggler";
import { EventCreator } from "../EventCreator";
import { EventType } from "../../../models/user/EventType";
import { useAppearance } from "../../../contexts/AppearanceContext.tsx";

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
  showUserBets?: (event_id: string, pageNum: string) => void;
  showAllBets?: (event_id: string) => void;
  isCreator?: boolean;
};

export function EventList({
  type,
  game,
  placeholderWhenEmpty,
  showUserBets: _showUserBets,
  showAllBets: _showAllBets,
  isCreator = false,
}: EventListProps) {
  const user = useCurrentUser();
  const [eventEditId, setEventEditId] = useState<string | undefined>(undefined);
  const [editorKey, setEditorKey] = useState(0);
  const [currPage, setCurrPage] = useState(1);
  const { isLight } = useAppearance();

  useEffect(() => {
    refetch();
    if (game) {
      console.log(game);
      refetchNumEvents();
    }
  }, [currPage, game]);

  const numEventsFetchValues = useFetch<number>({
    key: `eventlistlength${type}${game.id}`,
    func: Game.fetchNumEvents,
    args: [game.id],
    initialEnabled: false,
  });

  const eventsFetchValues = useFetch<Event[]>({
    key:
      Event.buildListCacheKey(game.id, currPage.toString(), type) +
      currPage +
      type,
    func: Event.fetchAll,
    args: [game.id, currPage, type == "past"],
    initialEnabled: false,
  });

  const { data: events, refetch, loading } = eventsFetchValues;

  const { data: numEvents, refetch: refetchNumEvents } = numEventsFetchValues;

  if (type == "upcoming")
    events?.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

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
    console.log(currPage, currPage * 5, numEvents);
    if (currPage * 5 < (numEvents ?? 0)) {
      //if ((numEvents ?? 0) == 5 || currPage == 0) {
      items = items.concat({ name: ">" });
    }
    return items;
  }

  const onCreate = useCallback(
    (type: EventType, name: string, datetime: Date): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        Event.create(name, game.id, type, datetime)
          .then((_) => {
            refetch(true);
            resolve(true);
          })
          .catch((error) => {
            reject();
            console.log(error);
          });
      });
    },
    [game],
  );

  const getTitle = useCallback(
    (event: EventListType): string => {
      if (type == "upcoming") {
        if (event.hasBetForUser) {
          return "bearbeiten";
        } else {
          return "platzieren";
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
      {" "}
      {isCreator && (
        <EventCreator
          onClick={onCreate}
          types={game?.discipline.eventTypes ?? []}
          game={game}
          onEventCreated={() => refetch(true)}
        />
      )}
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
                datetime: Utils.dateToString(item.datetime),
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
                          _showUserBets(it.id, currPage.toString());
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
                      icon={isLight() ? edit_black : edit_white}
                      title={""}
                      onClick={() => {
                        setEventEditId(it.id);
                      }}
                    />
                  </div>
                ),
            }}
          />
          {!loading && (
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

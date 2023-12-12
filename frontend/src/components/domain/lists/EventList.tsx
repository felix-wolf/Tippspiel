import React from "react";
import { Event } from "../../../models/Event";
import TableList from "../../design/TableList";
import { Button } from "../../design/Button";
import styles from "./EventList.module.scss";

export type EventTimeType = "upcoming" | "past";

type EventListProps = {
  type: EventTimeType;
  events: Event[];
  placeholderWhenEmpty?: React.ReactNode;
  onEventClicked?: (event_id: string) => void;
};

type EventListType = {
  id: string;
  name: string;
  datetime: string;
  betsButton: undefined;
  hasBets: boolean;
};

export function EventList({
  type,
  placeholderWhenEmpty,
  events,
  onEventClicked: _onEventClicked,
}: EventListProps) {
  function dateToString(date: Date): string {
    return `${date.getDate()}.${date.getMonth()}.${date.getFullYear()} - ${getDoubleDigit(
      date.getHours().toString(),
    )}:${getDoubleDigit(date.getMinutes().toString())}`;
  }

  function getDoubleDigit(digits: string): string {
    if (digits.length == 2) return digits;
    return "0" + digits;
  }

  return (
    <>
      <div className={styles.heading}>
        {type == "upcoming" ? "Anstehende Events" : "Vergangene Events"}
      </div>
      {events.length == 0 && placeholderWhenEmpty}
      {events.length != 0 && (
        <TableList
          displayNextArrow={false}
          items={events.map((item): EventListType => {
            return {
              id: item.id,
              name: item.name,
              datetime: dateToString(item.datetime),
              betsButton: undefined,
              hasBets: item.bets?.length == 5,
            };
          })}
          headers={{ name: "Name", datetime: "Zeit", betsButton: "Action" }}
          customRenderers={{
            betsButton: (it) => (
              <div style={{ width: 100 }}>
                <Button
                  onClick={() => {
                    if (_onEventClicked) _onEventClicked(it.id);
                  }}
                  type={it.hasBets ? "neutral" : "positive"}
                  title={it.hasBets ? "Tipps bearbeiten" : "Tippen"}
                  width={"flexible"}
                  height={"flexible"}
                />
              </div>
            ),
          }}
        />
      )}
    </>
  );
}
/*

      <List
        title={type == "upcoming" ? "Anstehende Events" : "Vergangene Events"}
        items={events.map((event) => (
          <EventItem
            key={event.id}
            hasBets={event.bets !== undefined && event.bets.length == 5}
            event={event}
            type={type}
            onEventClicked={_onEventClicked}
          />
        ))}
        emptyText={emptyButton ? undefined : "Es gab noch keine..."}
        emptyContent={events.length == 0 && emptyButton}
      />
 */

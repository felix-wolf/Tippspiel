import React, { useCallback } from "react";
import { Event } from "../../../models/Event";
import TableList from "../../design/TableList";
import { Button } from "../../design/Button";
import styles from "./EventList.module.scss";
import { Bet } from "../../../models/Bet";
import { useCurrentUser } from "../../../models/user/UserContext";
import edit from "../../../assets/icons/edit.svg";
import { Utils } from "../../../utils";

export type EventTimeType = "upcoming" | "past";

type EventListProps = {
  type: EventTimeType;
  events: Event[];
  placeholderWhenEmpty?: React.ReactNode;
  showUserBets?: (event_id: string) => void;
  showAllBets?: (event_id: string) => void;
  onEdit?: (event_id: string) => void;
  isCreator?: boolean;
};

type EventListType = {
  id: string;
  name: string;
  datetime: string;
  betsButton: undefined;
  editButton: undefined;
  userBet?: Bet;
  hasBets: boolean;
  type: EventTimeType;
};

export function EventList({
  type,
  placeholderWhenEmpty,
  events,
  showUserBets: _showUserBets,
  showAllBets: _showAllBets,
  onEdit: _onEdit,
  isCreator = false,
}: EventListProps) {
  const user = useCurrentUser();

  function dateToString(date: Date): string {
    return `${getDoubleDigit(date.getDate().toString())}.${getDoubleDigit(
      (date.getMonth() + 1).toString(),
    )}.${date.getFullYear()} - ${Utils.getTimeString(date)}`;
  }

  function getDoubleDigit(digits: string): string {
    if (digits.length == 2) return digits;
    return "0" + digits;
  }

  const getTitle = useCallback(
    (event: EventListType): string => {
      if (type == "upcoming") {
        if (event.userBet) {
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
    if (event.userBet) return "neutral";
    if (event.hasBets && type == "past") return "neutral";
    return "positive";
  }

  return (
    <>
      <div className={styles.heading}>
        {type == "upcoming" ? "Anstehende Events" : "Vergangene Events"}
      </div>
      {events.length == 0 && placeholderWhenEmpty}
      {events.length != 0 && (
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
              userBet: item.bets.find((bet) => bet.user_id == user?.id),
              hasBets: item.bets.length > 0,
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
              (it.type == "upcoming" || isCreator) && (
                <div className={styles.editContainer}>
                  <Button
                    type={"clear"}
                    width={"flexible"}
                    icon={edit}
                    title={""}
                    onClick={() => {
                      if (_onEdit) _onEdit(it.id);
                    }}
                  />
                </div>
              ),
          }}
        />
      )}
    </>
  );
}

import TableList from "../../design/TableList.tsx";
import { Checkbox } from "../../design/Checkbox.tsx";
import { Event } from "../../../models/Event.ts";
import { Utils } from "../../../utils.ts";
import { useState } from "react";
import styles from "../URLEventImporter.module.scss";
import { Button } from "../../design/Button.tsx";

type EventImportListProps = {
  events: Event[];
  onDismiss: () => void;
  onImportEvents: (events: Event[]) => void;
};

type EventImportListItem = {
  importCheckbox: undefined;
  name: string;
  datetime: string;
  isChecked: boolean;
  index: number;
  eventType: string;
  event: Event;
};

export function EventImportList({
  events,
  onDismiss: _onDismiss,
  onImportEvents: _onImportEvents,
}: EventImportListProps) {
  const [eventItems, setEventItems] = useState<EventImportListItem[]>(
    events.map((event: Event, idx) => {
      return {
        name: event.name,
        datetime: Utils.dateToString(event.datetime),
        index: idx,
        isChecked: true,
        importCheckbox: undefined,
        eventType: event.type.display_name,
        event: event,
      };
    }),
  );

  return (
    !!eventItems &&
    eventItems?.length != 0 && (
      <>
        <div className={styles.buttonContainer}>
          <Button
            onClick={() => {
              setEventItems(
                eventItems.map((event) => {
                  return { ...event, isChecked: true }; // Return a new object with updated isChecked
                }),
              );
            }}
            title={"Alle auswählen"}
          />
          <Button
            onClick={() => {
              setEventItems(
                eventItems.map((event) => {
                  return { ...event, isChecked: false }; // Return a new object with updated isChecked
                }),
              );
            }}
            title={"Alle abwählen"}
          />
          <Button
            onClick={() =>
              _onImportEvents(
                eventItems.filter((e) => e.isChecked).map((e) => e.event),
              )
            }
            type={"positive"}
            title={`${
              eventItems.filter((e) => e.isChecked).length
            } Events importieren`}
            isEnabled={eventItems.filter((e) => e.isChecked).length > 0}
          />
          <Button onClick={_onDismiss} type={"negative"} title={"Abbrechen"} />
        </div>
        <TableList
          onClick={(item) => {
            setEventItems(
              eventItems.map((event, idx) => {
                if (idx === item.index) {
                  return { ...event, isChecked: !item.isChecked };
                }
                return event;
              }),
            );
          }}
          items={eventItems}
          headers={{
            importCheckbox: "",
            name: "Name",
            datetime: "Zeit",
            eventType: "Art",
            isChecked: "",
          }}
          customRenderers={{
            importCheckbox: (it) => (
              <Checkbox checked={it.isChecked} onChange={() => {}} />
            ),
          }}
          displayNextArrow={false}
        />
      </>
    )
  );
}

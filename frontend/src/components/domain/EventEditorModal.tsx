import { EventCreator } from "./EventCreator";
import { DialogModal } from "../design/Dialog";
import { EventType } from "../../models/user/EventType";
import { Event } from "../../models/Event";
import { useCallback } from "react";
import styles from "./EventEditorModal.module.scss";

type EventEditorModalProps = {
  isOpened: boolean;
  types: EventType[] | undefined;
  onEdited: () => void;
  onCancel: () => void;
  event?: Event;
};

export function EventEditorModal({
  isOpened,
  types,
  onEdited: _onEdited,
  onCancel: _onCancel,
  event,
}: EventEditorModalProps) {
  const onCreate = useCallback(
    (type: EventType, name: string, datetime: Date): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        if (event?.game_id) {
          Event.update(event.id, name, event.game_id, type, datetime)
            .then((_) => {
              _onEdited();
              resolve(true);
            })
            .catch((error) => {
              reject();
              console.log(error);
            });
        } else {
          reject();
        }
      });
    },
    [event],
  );

  return (
    <DialogModal
      title={"Event bearbeiten"}
      isOpened={isOpened}
      onClose={_onCancel}
      style={{ height: 465 }}
    >
      <div className={styles.warning}>
        ACHTUNG: Ändern der Eventart löscht ALLE bereits platzierten Tipps!
      </div>
      <EventCreator onClick={onCreate} types={types} event={event} />
    </DialogModal>
  );
}

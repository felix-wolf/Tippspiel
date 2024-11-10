import { EventCreator } from "./EventCreator";
import { DialogModal } from "../design/Dialog";
import { EventType } from "../../models/user/EventType";
import { Event } from "../../models/Event";
import { useCallback } from "react";

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
  const onUpdateEvent = useCallback(
    (type: EventType, name: string, datetime: Date): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        if (event?.game_id) {
          Event.update(event.id, name, event.game_id, type, datetime)
            .then((_) => {
              _onEdited();
              resolve(true);
            })
            .catch(() => {
              reject();
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
      <EventCreator
        onClick={onUpdateEvent}
        types={types}
        event={event}
        onEventDeleted={_onEdited}
      />
    </DialogModal>
  );
}

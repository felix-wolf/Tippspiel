import { DialogModal } from "../design/Dialog.tsx";
import { Event } from "../../models/Event.ts";
import { EventImportList } from "./lists/EventImportList.tsx";

type EventImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  events: Event[];
};

export function EventImportModal({
  isOpen,
  onClose: _onClose,
  events,
}: EventImportModalProps) {
  return (
    <DialogModal
      title={"Events importiere..."}
      onClose={_onClose}
      isOpened={isOpen}
    >
      <EventImportList events={events} />
    </DialogModal>
  );
}

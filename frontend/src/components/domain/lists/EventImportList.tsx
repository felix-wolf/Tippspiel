import TableList from "../../design/TableList.tsx";
import { Checkbox } from "../../design/Checkbox.tsx";
import { Event } from "../../../models/Event.ts";

type EventImportListProps = {
  events: EventImportListItem[];
  onChange: (index: number, value: boolean) => void;
};

export type EventImportListItem = {
  importCheckbox: undefined;
  name: string;
  datetime: string;
  isChecked: boolean;
  index: number;
  event: Event;
};

export function EventImportList({
  events,
  onChange: _onChange,
}: EventImportListProps) {
  return (
    !!events &&
    events?.length != 0 && (
      <>
        <TableList
          onClick={(item) => _onChange(item.index, !item.isChecked)}
          items={events}
          headers={{
            importCheckbox: "",
            name: "Name",
            datetime: "Zeit",
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

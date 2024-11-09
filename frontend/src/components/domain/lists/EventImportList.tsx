import TableList from "../../design/TableList.tsx";
import { Checkbox } from "../../design/Checkbox.tsx";

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
          items={events}
          headers={{
            importCheckbox: "",
            name: "Name",
            datetime: "Zeit",
            isChecked: "",
          }}
          customRenderers={{
            importCheckbox: (it) => (
              <Checkbox
                checked={it.isChecked}
                onChange={() => {
                  _onChange(it.index, !it.isChecked);
                }}
              />
            ),
          }}
          displayNextArrow={false}
        />
      </>
    )
  );
}

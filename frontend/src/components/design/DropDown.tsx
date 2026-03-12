import { ChangeEvent, useCallback } from "react";

export type DropDownOption = {
  id: string;
  label: string;
};

type DropDownProps = {
  options: DropDownOption[];
  initial?: DropDownOption;
  selectedId?: string;
  onChange: (option: DropDownOption | undefined) => void;
};

export function DropDown({
  options,
  initial,
  selectedId,
  onChange: _onChange,
}: DropDownProps) {
  const onChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const option = options.find((option) => option.id == event.target.value);
      _onChange(option);
    },
    [_onChange, options],
  );
  return (
    <select
      className="w-full rounded-md bg-sky-600 p-2 text-sm text-white sm:w-auto sm:text-base"
      onChange={(event) => onChange(event)}
      value={selectedId ?? initial?.id}
    >
      {options.map((option) => {
        return (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        );
      })}
    </select>
  );
}

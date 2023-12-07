import styles from "./DropDown.module.scss";
import { ChangeEvent, useCallback } from "react";

export type DropDownOption = {
  id: string;
  label: string;
};

type DropDownProps = {
  options: DropDownOption[];
  initial?: DropDownOption;
  onChange: (option: DropDownOption | undefined) => void;
};

export function DropDown({
  options,
  initial,
  onChange: _onChange,
}: DropDownProps) {
  const onChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const option = options.find((option) => option.id == event.target.value);
      _onChange(option);
    },
    [options],
  );

  return (
    <select
      className={styles.container}
      onChange={(event) => onChange(event)}
      defaultValue={initial?.id}
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

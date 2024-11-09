import styles from "./Checkbox.module.scss";
import checkbox_checked from "../../assets/icons/checkbox_checked.svg";
import checkbox_unchecked from "../../assets/icons/checkbox_unchecked.svg";

type CheckboxProps = {
  checked?: boolean;
  onChange: (checked: boolean) => void;
};

export function Checkbox({ checked, onChange: _onChange }: CheckboxProps) {
  return (
    <div
      className={styles.container}
      onClick={() => {
        _onChange(!checked);
      }}
    >
      {checked && <img alt={"checkbox"} src={checkbox_checked} />}
      {checked == false && <img alt={"checkbox"} src={checkbox_unchecked} />}
    </div>
  );
}

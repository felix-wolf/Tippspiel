import styles from "./Checkbox.module.scss";
import checkbox_checked_black from "../../assets/icons/checkbox_checked_black.svg";
import checkbox_unchecked_black from "../../assets/icons/checkbox_unchecked_black.svg";
import checkbox_checked_white from "../../assets/icons/checkbox_checked_white.svg";
import checkbox_unchecked_white from "../../assets/icons/checkbox_unchecked_white.svg";
import { useAppearance } from "../../contexts/AppearanceContext.tsx";

type CheckboxProps = {
  checked?: boolean;
  onChange: (checked: boolean) => void;
};

export function Checkbox({ checked, onChange: _onChange }: CheckboxProps) {
  const { isLight } = useAppearance();
  return (
    <div
      className={styles.container}
      onClick={() => {
        _onChange(!checked);
      }}
    >
      {checked && (
        <img
          alt={"checkbox"}
          src={isLight() ? checkbox_checked_black : checkbox_checked_white}
        />
      )}
      {checked == false && (
        <img
          alt={"checkbox"}
          src={isLight() ? checkbox_unchecked_black : checkbox_unchecked_white}
        />
      )}
    </div>
  );
}

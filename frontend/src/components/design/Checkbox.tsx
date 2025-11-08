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
    <>
      {checked && (
        <img
          onClick={() => {
            _onChange(!checked);
          }}
          alt={"checkbox"}
          src={isLight() ? checkbox_checked_white : checkbox_checked_black}
        />
      )}
      {checked == false && (
        <img
          onClick={() => {
            _onChange(!checked);
          }}
          alt={"checkbox"}
          src={isLight() ? checkbox_unchecked_white : checkbox_unchecked_black}
        />
      )}
    </>
  );
}

import styles from "./TextField.module.scss";
import { useCallback, useRef } from "react";
import { cls } from "../styles/cls";

type TextFieldProps = {
  type?: "text" | "password";
  placeholder: string;
  onInput: (input: string) => void;
  initial?: string;
  shaking?: boolean;
};

export function TextField({
  type = "text",
  placeholder,
  onInput: _onInput,
  initial,
  shaking = false,
}: TextFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const onInput = useCallback(() => {
    let newValue = input.current?.value ?? "";
    _onInput?.(newValue);
  }, [_onInput]);

  return (
    <input
      className={cls(styles.textfield, shaking && styles.shake)}
      ref={input}
      title={initial}
      onInput={onInput}
      placeholder={placeholder}
      type={type}
    />
  );
}

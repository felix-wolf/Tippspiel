import styles from "./TextField.module.scss";
import { useCallback, useRef } from "react";

type TextFieldProps = {
  type?: "text" | "password";
  placeholder: string;
  onInput: (input: string) => void;
  initial?: string;
};

export function TextField({
  type = "text",
  placeholder,
  onInput: _onInput,
  initial,
}: TextFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const onInput = useCallback(() => {
    let newValue = input.current?.value ?? "";
    _onInput?.(newValue);
  }, [_onInput]);

  return (
    <input
      className={styles.textfield}
      ref={input}
      title={initial}
      onInput={onInput}
      placeholder={placeholder}
      type={type}
    />
  );
}

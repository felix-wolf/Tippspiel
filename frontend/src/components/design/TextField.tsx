import styles from "./TextField.module.scss";
import React, {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

type TextFieldProps = {
  type?: "text" | "password";
  placeholder: string;
  onInput: (input: string) => void;
  initial?: string;
};

export type TextFieldHandle = {
  /**
   * Value of the text field.
   */
  value: string;
  /**
   * Function invoked when text field is focused.
   */
  focus: () => void;
};

export const TextField = React.forwardRef<TextFieldHandle, TextFieldProps>(
  function TextField(
    { type = "text", placeholder, onInput: _onInput, initial }: TextFieldProps,
    ref,
  ) {
    const [value, setValue] = useState<string>(initial ?? "");
    const input = useRef<HTMLInputElement>(null);
    useImperativeHandle(
      ref,
      () => ({ value, focus: () => input.current?.focus() }),
      [value],
    );
    const onInput = useCallback(() => {
      let newValue = input.current?.value ?? "";
      setValue(newValue);
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
        value={value}
      />
    );
  },
);

import styles from "./TextField.module.scss";
import React, {
  useCallback,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

type TextFieldProps = {
  type?: "text" | "password";
  placeholder: string;
  onInput: (input: string) => void;
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
    { type = "text", placeholder, onInput: _onInput }: TextFieldProps,
    ref,
  ) {
    const [value, setValue] = useState<string>("");
    const input = useRef<HTMLInputElement>(null);
    useImperativeHandle(
      ref,
      () => ({ value, focus: () => input.current?.focus() }),
      [value],
    );
    const id = useId();

    const onInput = useCallback(() => {
      let newValue = input.current?.value ?? "";
      setValue(newValue);
      _onInput?.(newValue);
    }, [_onInput]);

    return (
      <input
        id={id}
        className={styles.textField}
        type={type}
        ref={input}
        value={value}
        onInput={onInput}
        placeholder={placeholder}
      />
    );
  },
);

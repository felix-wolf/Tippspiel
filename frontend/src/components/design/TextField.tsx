import styles from "./TextField.module.scss";
import React, {
  useCallback,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { isNumber } from "chart.js/helpers";

type TextFieldProps = {
  type?: "text" | "password" | "number";
  placeholder: string;
  onInput: (input: string) => void;
  initialValue?: string;
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
    {
      type = "text",
      placeholder,
      onInput: _onInput,
      initialValue = "",
    }: TextFieldProps,
    ref,
  ) {
    const [value, setValue] = useState<string>(initialValue);
    const input = useRef<HTMLInputElement>(null);
    useImperativeHandle(
      ref,
      () => ({ value, focus: () => input.current?.focus() }),
      [value],
    );
    const id = useId();
    const blockLetters = type == "number";

    const onInput = useCallback(() => {
      let newValue = input.current?.value ?? "";
      if (
        type != "number" ||
        (blockLetters && newValue == "") ||
        (blockLetters && isNumber(newValue))
      )
        setValue(newValue);
      _onInput?.(newValue);
    }, [_onInput, type, input]);

    return (
      <input
        id={id}
        className={styles.textField}
        type={type == "number" ? "text" : type}
        ref={input}
        value={value}
        onInput={onInput}
        placeholder={placeholder}
      />
    );
  },
);

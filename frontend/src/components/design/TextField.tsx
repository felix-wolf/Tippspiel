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
  icon?: React.ReactElement;
  autoComplete?: "off" | "on" | "username" | "current-password" | "new-password";
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
      autoComplete = "off",
      icon = undefined
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
      <div className="relative">
        {icon}
        <input
          id={id}
          autoComplete={autoComplete}
          className={`
            w-full py-3 bg-slate-800 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500 text-white
            ${icon != undefined && "pl-10 pr-3"}
            ${icon == undefined && "px-3"}
          `}
          type={type == "number" ? "text" : type}
          ref={input}
          value={value}
          onInput={onInput}
          placeholder={placeholder}
        />
      </div>
    );
  },
);

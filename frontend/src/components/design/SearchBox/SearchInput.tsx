import {
  ChangeEventHandler,
  FocusEvent,
  FocusEventHandler,
  useRef,
} from "react";
import styles from "./SearchInput.module.scss";
import { ClearIcon } from "./ClearIcon";
import { SearchIcon } from "./SearchIcon";

interface SearchInputProps {
  searchString: string;
  setSearchString: ChangeEventHandler<HTMLInputElement>;
  setHighlightedItem: Function;
  eraseResults: Function;
  autoFocus: boolean;
  onFocus: FocusEventHandler<HTMLInputElement>;
  onClear: Function;
  placeholder: string;
  showIcon: boolean;
  showClear: boolean;
  maxLength: number;
}

export default function SearchInput({
  searchString,
  setSearchString,
  setHighlightedItem,
  eraseResults,
  autoFocus,
  onFocus,
  onClear,
  placeholder,
  showIcon = true,
  showClear = true,
  maxLength,
}: SearchInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  let manualFocus = true;

  const setFocus = () => {
    manualFocus = false;
    ref?.current && ref.current.focus();
    manualFocus = true;
  };

  const handleOnFocus = (event: FocusEvent<HTMLInputElement>) => {
    manualFocus && onFocus(event);
  };

  const maxLengthProperty = maxLength ? { maxLength } : {};

  return (
    <div className={styles.container}>
      <SearchIcon showIcon={showIcon} />
      <input
        className={styles.input}
        type="text"
        ref={ref}
        spellCheck={false}
        value={searchString}
        onChange={setSearchString}
        onFocus={handleOnFocus}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onBlur={() => eraseResults()}
        onKeyDown={(event) => setHighlightedItem({ event })}
        data-test="search-input"
        {...maxLengthProperty}
      />
      <ClearIcon
        showClear={showClear}
        setSearchString={setSearchString}
        searchString={searchString}
        onClear={onClear}
        setFocus={setFocus}
      />
    </div>
  );
}

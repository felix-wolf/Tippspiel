import {
  ChangeEventHandler,
  FocusEvent,
  FocusEventHandler,
  useRef,
} from "react";
import { ClearIcon } from "./ClearIcon";
import { Search } from "lucide-react";

interface SearchInputProps {
  searchString: string;
  setSearchString: ChangeEventHandler<HTMLInputElement>;
  setHighlightedItem: Function;
  eraseResults: Function;
  autoFocus: boolean;
  onFocus: FocusEventHandler<HTMLInputElement>;
  onClear: Function;
  placeholder: string;
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
    <div className={"min-h-10 flex items-center w-full"}>
      <Search className="m-2" color="gray"/>
      <input
        className={`w-full h-10 pl-[13px] pr-0 py-0 border-0 outline-none focus:outline-none bg-transparent
         text-black placeholder:[color:grey] placeholder:opacity-100`}
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

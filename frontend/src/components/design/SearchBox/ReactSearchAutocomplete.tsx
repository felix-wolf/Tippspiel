import { default as Fuse } from "fuse.js";
import {
  ChangeEvent,
  FocusEvent,
  FocusEventHandler,
  KeyboardEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { defaultFuseOptions } from "./config";
import Results, { Item } from "./Results";
import SearchInput from "./SearchInput";
export const MAX_RESULTS = 10;

export interface ReactSearchAutocompleteProps<T> {
  items: T[];
  fuseOptions?: any;
  inputDebounce?: number;
  onSearch?: (keyword: string, results: T[]) => void;
  onHover?: (result: T) => void;
  onSelect?: (result: T) => void;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onClear?: Function;
  showClear?: boolean;
  maxResults?: number;
  placeholder?: string;
  autoFocus?: boolean;
  resultStringKeyName?: string;
  inputSearchString?: string;
  formatResult?: Function;
  showNoResults?: boolean;
  showNoResultsText?: string;
  showItemsOnFocus?: boolean;
  maxLength?: number;
  z_index?: number;
  defaultText?: string;
}

export default function ReactSearchAutocomplete<T>({
  items = [],
  fuseOptions = defaultFuseOptions,
  onSearch = () => { },
  onHover = () => { },
  onSelect = () => { },
  onFocus = () => { },
  onClear = () => { },
  showClear = true,
  maxResults = MAX_RESULTS,
  placeholder = "",
  autoFocus = false,
  resultStringKeyName = "name",
  inputSearchString = "",
  formatResult,
  showNoResults = true,
  showNoResultsText = "No results",
  showItemsOnFocus = false,
  maxLength = 0,
  z_index = 0,
}: ReactSearchAutocompleteProps<T>) {
  const options = { ...defaultFuseOptions, ...fuseOptions };

  const fuse = new Fuse(items, options);
  fuse.setCollection(items);

  const [searchString, setSearchString] = useState<string>(inputSearchString);
  const [results, setResults] = useState<any[]>([]);
  const [highlightedItem, setHighlightedItem] = useState<number>(-1);
  const [isSearchComplete, setIsSearchComplete] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showNoResultsFlag, setShowNoResultsFlag] = useState<boolean>(false);
  const [hasFocus, setHasFocus] = useState<boolean>(false);

  useEffect(() => {
    searchString?.length > 0 &&
      results &&
      results?.length > 0 &&
      setResults(fuseResults(searchString));
  }, [items]);

  useEffect(() => {
    if (
      showNoResults &&
      searchString.length > 0 &&
      !isTyping &&
      results.length === 0 &&
      !isSearchComplete
    ) {
      setShowNoResultsFlag(true);
    } else {
      setShowNoResultsFlag(false);
    }
  }, [isTyping, showNoResults, isSearchComplete, searchString, results]);

  useEffect(() => {
    if (
      showItemsOnFocus &&
      results.length === 0 &&
      searchString.length === 0 &&
      hasFocus
    ) {
      setResults(items.slice(0, maxResults));
    }
  }, [showItemsOnFocus, results, searchString, hasFocus, isTyping]);

  useEffect(() => {
    eraseResults();
  }, []);

  useEffect(() => {
    const handleDocumentClick = () => {
      eraseResults();
      setHasFocus(false);
    };

    document.addEventListener("click", handleDocumentClick);

    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  const handleOnFocus = (event: FocusEvent<HTMLInputElement>) => {
    onFocus(event);
    setHasFocus(true);
  };

  const callOnSearch = (keyword: string) => {
    let newResults: T[] = [];

    keyword?.length > 0 && (newResults = fuseResults(keyword));

    setResults(newResults);
    onSearch(keyword, newResults);
    setIsTyping(false);
  };

  const handleOnSearch = useCallback(
    (keyword: string) => {
      onClear();
      setTimeout(() => callOnSearch(keyword), 200);
    },
    [items],
  );

  const handleOnClick = (result: Item<T>) => {
    onSelect(result);
    setSearchString(result[resultStringKeyName]);
    setHighlightedItem(0);
    eraseResults();
  };

  const fuseResults = (keyword: string): T[] => {
    const splits = keyword.split("  ");
    let k = keyword;
    if (splits.length > 1) k = splits[1];
    return fuse
      .search(k, { limit: maxResults })
      .map((result) => ({ ...result.item }))
      .slice(0, maxResults);
  };

  const handleSetSearchString = ({ target }: ChangeEvent<HTMLInputElement>) => {
    const keyword = target.value;

    setSearchString(keyword);
    handleOnSearch(keyword);
    setIsTyping(true);

    if (isSearchComplete) {
      setIsSearchComplete(false);
    }
  };

  const eraseResults = () => {
    setResults([]);
    setIsSearchComplete(true);
  };

  const handleSetHighlightedItem = ({
    index,
    event,
  }: {
    index?: number;
    event?: KeyboardEvent<HTMLInputElement>;
  }) => {
    let itemIndex = -1;

    const setValues = (index: number) => {
      setHighlightedItem(index);
      results?.[index] && onHover(results[index]);
    };

    if (index !== undefined) {
      setHighlightedItem(index);
      results?.[index] && onHover(results[index]);
    } else if (event) {
      switch (event.key) {
        case "Tab":
        // fall through to enter case
        case "Enter":
          if (results.length > 0 && results[highlightedItem]) {
            event.preventDefault();
            onSelect(results[highlightedItem]);
            setSearchString(results[highlightedItem][resultStringKeyName]);
            onSearch(results[highlightedItem][resultStringKeyName], results);
          } else {
            onSearch(searchString, results);
          }
          setHighlightedItem(-1);
          eraseResults();
          break;
        case "ArrowUp":
          event.preventDefault();
          itemIndex =
            highlightedItem > -1 ? highlightedItem - 1 : results.length - 1;
          setValues(itemIndex);
          break;
        case "ArrowDown":
          event.preventDefault();
          itemIndex =
            highlightedItem < results.length - 1 ? highlightedItem + 1 : -1;
          setValues(itemIndex);
          break;
        default:
          break;
      }
    }
  };

  return (
    <div className={"relative h-10"} data-test="react-search-autocomplete">
      <div className={"absolute flex flex-col w-full bg-white/70  hover:shadow-md active:shadow-md focus-within:shadow-md border border-white rounded rounded-2xl z-0"} style={{ zIndex: z_index }}>
        <SearchInput
          searchString={searchString}
          setSearchString={handleSetSearchString}
          eraseResults={eraseResults}
          autoFocus={autoFocus}
          onFocus={handleOnFocus}
          onClear={onClear}
          placeholder={placeholder}
          showClear={showClear}
          setHighlightedItem={handleSetHighlightedItem}
          maxLength={maxLength}
        />
        <Results
          results={results}
          onClick={handleOnClick}
          setSearchString={setSearchString}
          maxResults={maxResults}
          resultStringKeyName={resultStringKeyName}
          formatResult={formatResult}
          highlightedItem={highlightedItem}
          setHighlightedItem={handleSetHighlightedItem}
          showNoResultsFlag={showNoResultsFlag}
          showNoResultsText={showNoResultsText}
        />
      </div>
    </div>
  );
}

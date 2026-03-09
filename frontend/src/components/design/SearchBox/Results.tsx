import { MouseEvent, ReactNode } from "react";

export type Item<T> = T & { [key: string]: any };

export interface ResultsProps<T> {
  results: Item<T>[];
  onClick: Function;
  highlightedItem: number;
  setHighlightedItem: Function;
  setSearchString: Function;
  formatResult?: Function;
  maxResults: number;
  resultStringKeyName: string;
  showNoResultsFlag?: boolean;
  showNoResultsText?: string;
}

export default function Results<T>({
  results = [] as any,
  onClick,
  setSearchString,
  maxResults,
  resultStringKeyName = "name",
  highlightedItem,
  setHighlightedItem,
  formatResult,
  showNoResultsFlag = true,
  showNoResultsText = "No results",
}: ResultsProps<T>) {
  type WithStringKeyName = T & Record<string, unknown>;

  const formatResultWithKey = formatResult
    ? formatResult
    : (item: WithStringKeyName) => item[resultStringKeyName];

  const handleClick = (result: WithStringKeyName) => {
    onClick(result);
    setSearchString(result[resultStringKeyName]);
  };

  const handleMouseDown = ({
    event,
    result,
  }: {
    event: MouseEvent<HTMLLIElement>;
    result: WithStringKeyName;
  }) => {
    if (event.button === 0) {
      event.preventDefault();
      handleClick(result);
    }
  };

  if (showNoResultsFlag) {
    return (
      <ResultsWrapper>
        <li
          data-test="no-results-message"
          className="flex flex-row px-3 py-2 text-slate-700"
        >
          <div className="ellipsis">{showNoResultsText}</div>
        </li>
      </ResultsWrapper>
    );
  }

  if (results?.length <= 0 && !showNoResultsFlag) {
    return null;
  }

  return (
    <ResultsWrapper>
      {results.slice(0, maxResults).map((result, index) => (
        <li
          className={`rounded-xl ${
            highlightedItem === index ? "bg-sky-100" : "hover:bg-slate-100"
          }`}
          onMouseEnter={() => setHighlightedItem({ index })}
          data-test="result"
          key={`rsa-result-${result.id}`}
          onMouseDown={(event) => handleMouseDown({ event, result })}
          onClick={() => handleClick(result)}
        >
          <div
            className="cursor-pointer ellipsis px-3 py-2 text-lg text-slate-900"
            title={result[resultStringKeyName] as string}
          >
            {formatResultWithKey(result)}
          </div>
        </li>
      ))}
    </ResultsWrapper>
  );
}

const ResultsWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xl">
      <ul className="">{children}</ul>
    </div>
  );
};

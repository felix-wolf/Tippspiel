import { MouseEvent, ReactNode } from "react";
import { SearchIcon } from "./SearchIcon";
import styles from "./Results.module.scss";
import { cls } from "../../../styles/cls";

export type Item<T> = T & { [key: string]: any };

export interface ResultsProps<T> {
  results: Item<T>[];
  onClick: Function;
  highlightedItem: number;
  setHighlightedItem: Function;
  setSearchString: Function;
  formatResult?: Function;
  showIcon: boolean;
  maxResults: number;
  resultStringKeyName: string;
  showNoResultsFlag?: boolean;
  showNoResultsText?: string;
}

export default function Results<T>({
  results = [] as any,
  onClick,
  setSearchString,
  showIcon,
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
        <li data-test="no-results-message">
          <SearchIcon showIcon={showIcon} />
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
          className={cls(highlightedItem === index && styles.selected)}
          onMouseEnter={() => setHighlightedItem({ index })}
          data-test="result"
          key={`rsa-result-${result.id}`}
          onMouseDown={(event) => handleMouseDown({ event, result })}
          onClick={() => handleClick(result)}
        >
          <SearchIcon showIcon={showIcon} />
          <div
            className={styles.ellipsis}
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
    <div>
      <div className={styles.line} />
      <ul className={styles.ul}>{children}</ul>
    </div>
  );
};

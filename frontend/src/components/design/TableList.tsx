import React, { useEffect, useRef, useState } from "react";
import styles from "./TableList.module.scss";
import next from "../../assets/icons/plus.svg";
import { cls } from "../../styles/cls";

/**
 * Determines whether the provided value is a primitive type.
 *
 * @param value the value to check type for
 * @return true if the value is a primitive (string, number or boolean)
 */
export function isPrimitiveType(value: unknown): value is PrimitiveType {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

/**
 * This function filters the items so that only the properties that are listed in the header will be displayed.
 * It also arranges them in the order of the header.
 */
export function sortItemsByHeader<
  T extends Record<string, unknown>,
  U extends keyof T,
>(item: T, keys: U[]): Pick<T, U> {
  return Object.fromEntries(keys.map((key) => [key, item[key]])) as Pick<T, U>;
}

export interface ListProps<T extends ListElement> {
  /**
   * the caption of the table
   */
  caption?: string;
  /**
   * A custom caption Element
   */
  captionElement?: React.ReactNode;
  /**
   * The list of the displayed objects. Can be any type that has string keys.
   */
  items: T[];
  /**
   * The header objects has a subset of the keys of the displayed object type. The table shows only these properties
   * and displays them in the order given in the header. For each key in the header a string is given, that names the
   * column.
   *
   *  */
  headers: TableHeaders<T>;
  /**
   * The onClick property requires a function that maps that takes an object of the respective type and returns void.
   */
  onClick?: ((a: T) => void) | undefined;
  /**
   * The customRenderer property enables the table to display custom rendered columns. This is the only way to display
   * object properties that do not have a primitive type.
   */
  customRenderers: CustomRenderers<T>;
  /**
   *  A simple flag if the rows of the table should display an indicator image that they are clickable.
   */
  displayNextArrow?: boolean;
  cellHeight?: "short" | "tall";
  alignLastRight?: boolean;
  maxHeight?: number;
}

type PrimitiveType = string | number | boolean;

type TableHeaders<T extends ListElement> = Partial<Record<keyof T, string>>;

type CustomRenderers<T extends ListElement> = Partial<
  Record<keyof T, (it: T) => React.ReactNode>
>;

type ListElement = Record<string, any>;

type ListTitleProps = React.PropsWithChildren<{
  /**
   * The title of the list title object.
   */
  title: string;
}>;

/**
 * A list title, offering the possibility to have complex table titles instead of just plain text.
 * Title is wrapped around custom element, title has to be provided.
 */
export function ListTitle({ title, children }: ListTitleProps) {
  return (
    <caption className={styles.caption}>
      <div className={styles.listTitle}>
        {title}
        {children}
      </div>
    </caption>
  );
}

/**
 Creates a generic list that is used in many screens. It will require a list of Objects, headers that should be displayed on the top,
 a select function that is called on the object of a selected row and optional custom renderers.
 */
export default function TableList<T extends ListElement>({
  caption,
  captionElement,
  onClick,
  customRenderers,
  headers,
  displayNextArrow = true,
  items,
  cellHeight = "tall",
  alignLastRight = false,
  maxHeight = 99999,
}: ListProps<T>) {
  const [scrolled, setScrolled] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const listener = (event: Event) => {
      const scroll = (event.target as HTMLDivElement).scrollTop;
      setScrolled(scroll > (caption ? 70 : 32));
    };

    const parent = container.current?.parentElement;
    if (!parent) return;

    parent.addEventListener("scroll", listener);
    return () => parent.removeEventListener("scroll", listener);
  }, []);

  /**
   * Internal function that returns the row element for an item.
   * @param item
   * @param key the table row
   */
  function renderRow(item: T, key: number) {
    return (
      <tr
        key={key}
        className={styles.tableRow}
        onClick={() => (onClick ? onClick(item) : undefined)}
      >
        {Object.entries(sortItemsByHeader(item, Object.keys(headers))).map(
          ([property, value], index) => {
            const customRenderer = customRenderers?.[property];

            // TODO is `isPrimitiveValue` really the right condition? do we want to print booleans like that?
            return (
              <td
                className={cls(
                  cellHeight == "short" && styles.tdShort,
                  index == Object.keys(headers).length - 1 &&
                    alignLastRight &&
                    styles.alignRight,
                )}
                key={index}
              >
                {customRenderer?.(item) ??
                  (isPrimitiveType(value) ? value : "")}
              </td>
            );
          },
        )}
        {displayNextArrow && (
          <td
            key={Object.keys(item).length + 1}
            className={styles.buttonDataEntry}
          >
            <img className={styles.icon} src={next} alt={""}></img>
          </td>
        )}
      </tr>
    );
  }

  return (
    <div className={styles.scrollDivParent} ref={container}>
      <div style={{ maxHeight: maxHeight }} className={styles.scrollDiv}>
        <table
          className={cls(
            styles.table,
            cellHeight == "short" ? styles.tableShort : styles.tableTall,
          )}
        >
          {captionElement}
          {!captionElement && (
            <caption className={styles.caption}>{caption}</caption>
          )}
          <thead className={cls(scrolled && styles.scrolled)}>
            <tr>
              {Object.values(headers).map((headerValue, index) => (
                <th key={index} className={styles.tableHead}>
                  {headerValue}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{items.map(renderRow)}</tbody>
        </table>
      </div>
    </div>
  );
}

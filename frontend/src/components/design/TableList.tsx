import React, { useEffect } from "react";
import next from "../../assets/icons/plus.svg";

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
  maxHeight
}: ListProps<T>) {
  // const [scrolled, setScrolled] = useState(false);
  // const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // const listener = (event: Event) => {
    //   const scroll = (event.target as HTMLDivElement).scrollTop;
    //   setScrolled(scroll > (caption ? 70 : 32));
    // };

    // const parent = container.current?.parentElement;
    // if (!parent) return;

    // parent.addEventListener("scroll", listener);
    // return () => parent.removeEventListener("scroll", listener);
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
        className="hover:bg-white/50 transition"
        onClick={() => (onClick ? onClick(item) : undefined)}
      >
        {Object.entries(sortItemsByHeader(item, Object.keys(headers))).map(
          ([property, value], index) => {
            const customRenderer = customRenderers?.[property];

            // TODO is `isPrimitiveValue` really the right condition? do we want to print booleans like that?
            return (
              <td
                className="py-2 px-3"
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
            // text-align: right
            className="text-right"
          >
            <img className="w20 h20" src={next} alt={""}></img>
          </td>
        )}
      </tr>
    );
  }

  return (
    <div className={`
      text-left text-gray-800
      ${maxHeight != undefined ? "max-h-110 overflow-y-scroll" : "h-full"}
      `}>
    <table className="w-full">
      {captionElement}
      {!captionElement && (
        <caption className="text-start">{caption}</caption>
      )}
      <thead>
        <tr className="border-b border-white/60">
          {Object.values(headers).map((headerValue, index) => (
            <th key={index} className="py-2 px-3">
              {headerValue}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{items.map(renderRow)}</tbody>
    </table>
    </div>
  );
}

import React, { useState } from "react";
import { Button } from "./Button";
import styles from "./Toggler.module.scss";

export type TogglerItem = {
  name: string;
  component?: React.ReactNode;
  highlight?: boolean;
};

type TogglerProps = {
  height?: "normal" | "small";
  initialIndex?: number;
  items: TogglerItem[];
  highlight?: boolean;
  didSelect?: (item: TogglerItem) => void;
};

type TogglerItemProps = {
  component: React.ReactNode;
};
function TogglerItem({ component }: TogglerItemProps) {
  return <>{component}</>;
}

export function Toggler({
  items,
  height = "normal",
  initialIndex = 0,
  didSelect: _didSelect,
  highlight = true,
}: TogglerProps) {
  const [itemIndex, setItemIndex] = useState(initialIndex);

  function getCorners(index: number, length: number): boolean[] {
    if (length == 1) return [true, true, true, true];
    if (index == 0) return [false, false, true, true];
    if (index == length - 1) return [true, true, false, false];
    return [false, false, false, false];
  }

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        {items.map((item, index) => (
          <div key={index} className={styles.button}>
            <Button
              key={index}
              onClick={() => {
                setItemIndex(index);
                if (_didSelect) {
                  _didSelect(items[index]);
                }
              }}
              title={item.name}
              type={
                item.highlight == false
                  ? "neutral"
                  : highlight && itemIndex == index
                    ? "neutral"
                    : "positive"
              }
              width={"flexible"}
              height={height == "small" ? "flexible" : "fixed"}
              rounded={getCorners(index, items.length)}
            />
          </div>
        ))}
      </div>
      {items.map(
        (item, index) =>
          itemIndex == index && (
            <TogglerItem key={index} component={item.component} />
          ),
      )}
    </div>
  );
}

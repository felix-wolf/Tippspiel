import styles from "./List.module.scss";
import { cls } from "../../styles/cls";
import React from "react";

type ListProps = {
  title: string | undefined;
  items: React.ReactNode[];
  emptyContent?: React.ReactNode;
  emptyText?: string;
  max_height?: number;
  displayBorder?: boolean;
  align?: "left" | "center";
};

export function List({
  title,
  items,
  emptyContent,
  emptyText,
  max_height = 200,
  displayBorder = true,
  align = "left",
}: ListProps) {
  return (
    <div className={styles.container}>
      <div className={styles.heading}>{title}</div>
      <div
        style={{ maxHeight: max_height }}
        className={cls(
          styles.list,
          align == "center" && styles.alignCenter,
          items.length == 0 && styles.empty,
          displayBorder && styles.border,
        )}
      >
        {items.length == 0 && emptyText && (
          <div className={styles.empty_text}>{emptyText}</div>
        )}
        {items.length == 0 && emptyContent && emptyContent}
        {items.length != 0 && items.map((item: any) => item)}
      </div>
    </div>
  );
}

import styles from "./List.module.scss";
import { cls } from "../../../styles/cls";
import React from "react";

type ListProps = {
  title: string | undefined;
  items: React.ReactNode[];
  emptyContent?: React.ReactNode;
  emptyText?: string;
};

export function List({ title, items, emptyContent, emptyText }: ListProps) {
  return (
    <div className={styles.container}>
      <div className={styles.heading}>{title}</div>
      <div className={cls(styles.list, items.length == 0 && styles.empty)}>
        {items.length == 0 && emptyText && (
          <div className={styles.empty_text}>{emptyText}</div>
        )}
        {items.length == 0 && emptyContent && emptyContent}
        {items.length != 0 && items.map((item: any) => item)}
      </div>
    </div>
  );
}

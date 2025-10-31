import styles from "./List.module.scss";
import { cls } from "../../styles/cls";
import React from "react";

type ListProps = {
  title: string | undefined;
  items: React.ReactNode[];
  emptyContent?: React.ReactNode;
  max_height?: number;
  displayBorder?: boolean;
  align?: "left" | "center";
  scroll?: boolean;
};

export function List({
  title,
  items,
  emptyContent,
  max_height = 200,
  displayBorder = true,
  align = "left",
  scroll = true,
}: ListProps) {
  return (<>
    <div className="text-xl font-semibold text-gray-800 mb-4">{title}</div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {items.length == 0 && emptyContent && emptyContent}
      {items.length != 0 && items.map((item: any) => item)}
    </div>
  </>
    // <div className={styles.container}>
    //   <div className="text-xl font-semibold text-gray-800 mb-4">{title}</div>
    //   <div
    //     style={{ maxHeight: max_height }}
    //     className={cls(
    //       styles.list,
    //       align == "center" && styles.alignCenter,
    //       items.length == 0 && styles.empty,
    //       displayBorder && styles.border,
    //       scroll && styles.scroll,
    //     )}
    //   >
    //     {items.length == 0 && emptyText && (
    //       <div className={styles.empty_text}>{emptyText}</div>
    //     )}
    //     {items.length == 0 && emptyContent && emptyContent}
    //     {items.length != 0 && items.map((item: any) => item)}
    //   </div>
    // </div>
  );
}

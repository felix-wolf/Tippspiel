import React from "react";
import styles from "./Page.module.scss";
import { cls } from "../../styles/cls";

type PageProbs = React.PropsWithChildren<{
  title: string;
}>;

export function Page({ title, children }: PageProbs) {
  return (
    <div className={cls(styles.container)}>
      <div className={cls(styles.header)}>
        <h1>{title}</h1>
      </div>
      <div className={styles.main}>{children}</div>
    </div>
  );
}

import React from "react";
import styles from "./Shakable.module.scss";
import { cls } from "../../styles/cls";

type ShakableProps = React.PropsWithChildren<{
  shaking: boolean;
}>;

export function Shakable({ shaking, children }: ShakableProps) {
  return <div className={cls(shaking && styles.shake)}>{children}</div>;
}

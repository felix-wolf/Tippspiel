import React, { useState } from "react";
import { Button } from "./Button";
import styles from "./Toggler.module.scss";

type TogglerItem = {
  name: string;
  component: React.ReactNode;
};

type TogglerProps = {
  left: TogglerItem;
  right: TogglerItem;
};

export function Toggler({ left, right }: TogglerProps) {
  const [showLeft, setShowLeft] = useState(true);
  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <div className={styles.button}>
          <Button
            onClick={() => setShowLeft(true)}
            title={left.name}
            type={showLeft ? "neutral" : "positive"}
            width={"flexible"}
            rounded={[false, false, true, true]}
          />
        </div>
        <div className={styles.button}>
          <Button
            onClick={() => setShowLeft(false)}
            title={right.name}
            type={showLeft ? "positive" : "neutral"}
            width={"flexible"}
            rounded={[true, true, false, false]}
          />
        </div>
      </div>
      {showLeft && left.component}
      {!showLeft && right.component}
    </div>
  );
}

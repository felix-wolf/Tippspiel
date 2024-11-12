import { useState } from "react";
import styles from "./IconToggler.module.scss";

type IconTogglerProps = {
  icons: string[];
  num_states?: number;
  initialState?: number;
  didChange: (newState: number) => void;
};

export function IconToggler({
  icons,
  num_states = 2,
  initialState = 0,
  didChange: _didChange,
}: IconTogglerProps) {
  const [state, setState] = useState(initialState);
  return (
    <div className={styles.con}>
      <div
        className={styles.container}
        onClick={() => {
          const newState = (state + 1) % num_states;
          setState(newState);
          _didChange(newState);
        }}
      >
        <img className={styles.icon} src={icons[state]} alt={"image"} />
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import styles from "./IconToggler.module.scss";

type IconTogglerProps = {
  icons: string[];
  num_states?: number;
  initialState?: number;
  didChange: (newState: number) => Promise<void> | void;
};

export function IconToggler({
  icons,
  num_states = 2,
  initialState = 0,
  didChange: _didChange,
}: IconTogglerProps) {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    setState(initialState);
  }, [initialState]);
  return (
    <div className={styles.con}>
      <div
        className={styles.container}
        onClick={() => {
          const oldState = state;
          const newState = (state + 1) % num_states;
          setState(newState);
          _didChange(newState)
            ?.then()
            .catch(() => {
              setState(oldState);
            });
        }}
      >
        <img className={styles.icon} src={icons[state]} alt={"image"} />
      </div>
    </div>
  );
}

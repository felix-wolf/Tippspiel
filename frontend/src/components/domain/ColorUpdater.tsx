import { useState } from "react";
import { User } from "../../models/user/User";
import Colorful from "@uiw/react-color-colorful";
import { Button } from "../design/Button";
import styles from "./ColorUpdater.module.scss";
import { cls } from "../../styles/cls";

type ColorUpdaterProps = {
  user: User;
  onUpdated: () => void;
};

export function ColorUpdater({
  user,
  onUpdated: _onUpdated,
}: ColorUpdaterProps) {
  const [color, setColor] = useState(user.color);
  const [isPicking, setIsPicking] = useState(false);

  function saveChoice() {
    User.updateColor(user.id, color).then((user) => {
      user.saveToStorage();
      setIsPicking(false);
      _onUpdated();
    });
  }

  function reset() {
    setIsPicking(false);
    setColor(user.color);
  }

  return (
    <div className={styles.container}>
      {!isPicking && (
        <div className={styles.buttonContainer}>
          <Button
            onClick={() => setIsPicking(true)}
            title={"Farbe ändern"}
            width={"flexible"}
            height={"flexible"}
          />
        </div>
      )}
      {isPicking && (
        <div className={styles.column}>
          <Colorful
            color={color}
            disableAlpha={true}
            onChange={(color) => {
              setColor(color.hex);
            }}
          />
          <div className={cls(styles.column, styles.buttons)}>
            <Button
              onClick={() => saveChoice()}
              title={"Speichern"}
              type={"positive"}
              width={"flexible"}
            />
            <div style={{ height: 16 }}>
              <Button
                onClick={() => reset()}
                title={"Abbrechen"}
                type={"negative"}
                width={"flexible"}
                height={"flexible"}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

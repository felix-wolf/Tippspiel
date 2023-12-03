import styles from "./GameCreator.module.scss";
import { TextField } from "./TextField";
import { Button } from "./Button";
import { useState } from "react";

type GameCreatorProps = {
  onCreate: (name: string, password?: string) => void;
  onClose: () => void;
};

export function GameCreator({
  onCreate: _onCreate,
  onClose: _onClose,
}: GameCreatorProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className={styles.container}>
      <div>
        <TextField
          onInput={(i) => {
            setName(i);
          }}
          placeholder={"Name"}
        />
        <TextField
          onInput={(i) => {
            setPassword(i);
          }}
          placeholder={"Passwort (optional)"}
          type={"password"}
        />
      </div>
      <div className={styles.buttonsContainer}>
        <Button
          onClick={_onClose}
          title={"Close"}
          type={"negative"}
          width={"flexible"}
          height={"flexible"}
        />
        <Button
          onClick={() => {
            _onCreate(name, password ? password : undefined);
          }}
          title={"Create"}
          type={"positive"}
          width={"flexible"}
          isEnabled={name != ""}
        />
      </div>
    </div>
  );
}

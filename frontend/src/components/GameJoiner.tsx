import styles from "./GameJoiner.module.scss";
import { TextField } from "./TextField";
import { useState } from "react";
import { Button } from "./Button";
import { Game } from "../models/Game";

type GameJoinerProps = {
  game: Game;
  onClose: () => void;
};

export function GameJoiner({ game, onClose: _onClose }: GameJoinerProps) {
  const [password, setPassword] = useState("");

  console.log(game);
  return (
    <div className={styles.container}>
      <div className={styles.column}>
        <div>Tippspiel beitreten?</div>
      </div>
      <div className={styles.textContainer}>
        <div>Name: {game.name}</div>
        <div>Spieler: {game.players.length}</div>
        <div>Ersteller: {game.creator?.name}</div>
        {game.hasPassword && (
          <TextField
            placeholder={"password"}
            onInput={(i) => {
              setPassword(i);
            }}
          />
        )}
      </div>
      <div className={styles.buttonContainer}>
        <Button
          onClick={_onClose}
          title={"Schließen"}
          type={"negative"}
          width={"flexible"}
          height={"flexible"}
        />
        <Button
          onClick={_onClose}
          title={"Beitreten"}
          type={"positive"}
          width={"flexible"}
          isEnabled={!game.hasPassword || password != ""}
        />
      </div>
    </div>
  );
}

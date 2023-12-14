import styles from "./GameJoiner.module.scss";
import { TextField } from "../design/TextField";
import { useState } from "react";
import { Button } from "../design/Button";
import { Game } from "../../models/Game";
import { Shakable } from "../design/Shakable";

type GameJoinerProps = {
  game: Game;
  onClose: () => void;
  shaking?: boolean;

  onJoin: (password?: string) => void;
};

export function GameJoiner({
  game,
  onClose: _onClose,
  onJoin: _onJoin,
  shaking = false,
}: GameJoinerProps) {
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
          <Shakable shaking={shaking}>
            <TextField
              placeholder={"password"}
              onInput={(i) => {
                setPassword(i);
              }}
            />
          </Shakable>
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
          onClick={() => {
            _onJoin(password != "" ? password : undefined);
          }}
          title={"Beitreten"}
          type={"positive"}
          width={"flexible"}
          isEnabled={!game.hasPassword || password != ""}
        />
      </div>
    </div>
  );
}

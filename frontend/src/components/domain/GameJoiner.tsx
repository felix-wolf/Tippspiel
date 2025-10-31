import { TextField } from "../design/TextField";
import { Game } from "../../models/Game";
import { Shakable } from "../design/Shakable";

type GameJoinerProps = {
  game: Game;
  shaking?: boolean;
  onEnterPassword: (password: string) => void;
};

export function GameJoiner({
  game,
  shaking = false,
  onEnterPassword: _onEnterPassword,
}: GameJoinerProps) {

  return (
      <div className="flex flex-col gap-1">
        <div className="text-base mb-2 text-white">
        <div>Name: {game.name}</div>
        <div>Spieler: {game.players.length}</div>
        <div>Ersteller: {game.creator?.name}</div>
        </div>
        {game.hasPassword && (
          <Shakable shaking={shaking}>
            <TextField
              placeholder={"password"}
              onInput={(i) => {
                _onEnterPassword(i);
              }}
            />
          </Shakable>
        )}

    </div>
  );
}

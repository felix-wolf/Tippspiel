import styles from "./BettingGameItem.module.scss";
import plus from "../../assets/icons/plus.svg";
import { cls } from "../../styles/cls";
import { useCallback, useState } from "react";
import { GameCreator } from "../GameCreator";
import { GameJoiner } from "../GameJoiner";
import { Game } from "../../models/Game";

export type BettingGameItemGame = {
  game: Game;
  type: "real" | "add";
};

type BettingGameItemProps = {
  onGameSelect?: (id: string) => void;
  onCreate?: (name: string, password?: string) => void;
  onJoin?: (game_id: string, password?: string) => void;
  item?: BettingGameItemGame;
  type: "real" | "add";
  joined?: boolean;
};

export function BettingGameItem({
  item,
  joined = true,
  onGameSelect: _onGameSelect,
  onCreate: _onCreate,
  onJoin: _onJoin,
  type,
}: BettingGameItemProps) {
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const onPlaceholderClick = useCallback(() => {
    if (!creating) setCreating(true);
  }, [creating]);

  const onClick = useCallback(() => {
    if (!creating) {
      if (_onGameSelect && item) {
        if (joined) {
          _onGameSelect(item.game.id);
        } else {
          console.log("ask to join");
          if (!joining) setJoining(true);
        }
      }
    }
  }, [type, item, creating, joined, joining]);

  return (
    <>
      {type != "add" && (
        <div
          className={cls(
            styles.container,
            styles.visible,
            styles.game,
            joining && styles.joining,
          )}
          onClick={onClick}
        >
          {!joining && item?.game.name}
          {joining && item?.game && (
            <GameJoiner
              game={item?.game}
              onClose={() => {
                setJoining(false);
              }}
              onJoin={(password) => {
                _onJoin && _onJoin(item?.game.id, password);
              }}
            />
          )}
        </div>
      )}
      {type == "add" && (
        <div
          className={cls(
            styles.container,
            styles.visible,
            creating && styles.creating,
          )}
          onClick={!creating ? onPlaceholderClick : undefined}
        >
          {!creating && (
            <>
              <img alt={"icon"} className={styles.icon} src={plus} />
              <div className={styles.text}>Neu</div>
            </>
          )}
          {creating && (
            <GameCreator
              onCreate={(name, password) => {
                _onCreate && _onCreate(name, password);
              }}
              onClose={() => setCreating(false)}
            />
          )}
        </div>
      )}
    </>
  );
}

import styles from "./BettingGameItem.module.scss";
import plus from "../../../assets/icons/plus.svg";
import { cls } from "../../../styles/cls";
import { useCallback, useState } from "react";
import { GameCreator } from "../GameCreator";
import { GameJoiner } from "../GameJoiner";
import { Game } from "../../../models/Game";

export type BettingGameItemGame = {
  game?: Game;
  type: "real" | "add";
};

type BettingGameItemProps = {
  onGameSelect?: (id: string) => void;
  onCreate?: (name: string, password?: string, disciplineId?: string) => void;
  onJoin?: (game_id: string, password?: string) => Promise<boolean>;
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
  const [shaking, setShaking] = useState(false);

  const onPlaceholderClick = useCallback(() => {
    if (!creating) setCreating(true);
  }, [creating]);

  const onClick = useCallback(() => {
    if (!creating) {
      if (_onGameSelect && item) {
        if (joined && item.game?.id) {
          _onGameSelect(item.game.id);
        } else {
          if (!joining) setJoining(true);
        }
      }
    }
  }, [type, item, creating, joined, joining]);

  const onJoinClicked = useCallback(
    (password: string | undefined) => {
      if (_onJoin && item?.game?.id) {
        _onJoin(item.game.id, password).then((success) => {
          setShaking(!success);
          setTimeout(() => setShaking(false), 300);
        });
      }
    },
    [item],
  );

  return (
    <>
      {type != "add" && (
        <div
          className={cls(
            styles.container,
            styles.visible,
            styles.game,
            joining && styles.joining,
            joined && styles.joined,
          )}
          onClick={onClick}
        >
          {!joining && item?.game?.name}
          {joining && item?.game && (
            <GameJoiner
              shaking={shaking}
              game={item?.game}
              onClose={() => {
                setJoining(false);
              }}
              onJoin={onJoinClicked}
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
              onCreate={(name, password, disciplineId) => {
                _onCreate && _onCreate(name, password, disciplineId);
              }}
              onClose={() => setCreating(false)}
            />
          )}
        </div>
      )}
    </>
  );
}

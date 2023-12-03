import styles from "./BettingGameItem.module.scss";
import plus from "../assets/icons/plus.svg";
import { cls } from "../styles/cls";
import { useCallback, useState } from "react";
import { GameCreator } from "./GameCreator";

export type BettingGame = {
  id: string;
  name: string;
};

type BettingGameItemProps = {
  onGameSelect?: (id: string) => void;
  onCreate?: (name: string, password?: string) => void;
  game?: BettingGame;
  is_placeholder?: boolean;
  is_hidden?: boolean;
};

export function BettingGameItem({
  game,
  onGameSelect: _onGameSelect,
  onCreate: _onCreate,
  is_placeholder = false,
  is_hidden = false,
}: BettingGameItemProps) {
  const [creating, setCreating] = useState(false);

  const onClick = useCallback(() => {
    if (!is_hidden && !creating) {
      if (is_placeholder) {
      }
      setCreating(true);
      console.log("click");
      if (_onGameSelect && game) {
        _onGameSelect(game.id);
      }
    }
  }, [is_hidden, game, creating]);

  const onCreateClick = useCallback((name: string, password?: string) => {
    if (_onCreate) {
      _onCreate(name, password);
    }
  }, []);

  return (
    (is_placeholder || is_hidden) && (
      <div
        className={cls(
          styles.container,
          !is_hidden && styles.visible,
          creating && styles.creating,
        )}
        onClick={onClick}
      >
        {!is_hidden && !creating && (
          <>
            <img className={styles.icon} src={plus} />
            <div className={styles.text}>Neu</div>
          </>
        )}
        {creating && (
          <GameCreator
            onCreate={onCreateClick}
            onClose={() => setCreating(false)}
          />
        )}
      </div>
    )
  );
}

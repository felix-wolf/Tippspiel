import styles from "./Button.module.scss";
import { cls } from "../styles/cls";
import { useCallback } from "react";

type ButtonProps = {
  onClick: () => void;
  onDisabledClick?: () => void;
  title: string;
  type?: "positive" | "negative" | "neutral";
  isEnabled?: boolean;
};

export function Button({
  title,
  onClick: _onClick,
  onDisabledClick: _onDisClick,
  type = "neutral",
  isEnabled = true,
}: ButtonProps) {
  const onClick = useCallback(() => {
    if (isEnabled) {
      _onClick();
    } else if (_onDisClick) {
      _onDisClick();
    }
  }, [isEnabled, _onClick]);

  return (
    <button
      className={cls(
        styles.button,
        type == "positive" && styles.positive,
        type == "negative" && styles.negative,
        type == "neutral" && styles.neutral,
        isEnabled && styles.enabled,
        !isEnabled && styles.disabled,
      )}
      onClick={onClick}
    >
      {title}
    </button>
  );
}

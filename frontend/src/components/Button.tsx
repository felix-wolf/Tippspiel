import styles from "./Button.module.scss";
import { cls } from "../styles/cls";
import { useCallback } from "react";

type ButtonProps = {
  onClick: () => void;
  onDisabledClick?: () => void;
  title: string;
  type?: "positive" | "negative" | "neutral";
  isEnabled?: boolean;
  width?: "fixed" | "flexible";
  height?: "fixed" | "flexible";
};

export function Button({
  title,
  onClick: _onClick,
  onDisabledClick: _onDisClick,
  type = "neutral",
  isEnabled = true,
  width = "fixed",
  height = "fixed",
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
        width == "flexible" && styles.flexible_width,
        height == "flexible" && styles.flexible_height,
        isEnabled && styles.enabled,
        !isEnabled && styles.disabled,
      )}
      onClick={onClick}
    >
      {title}
    </button>
  );
}

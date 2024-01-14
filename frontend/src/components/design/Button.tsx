import styles from "./Button.module.scss";
import { cls } from "../../styles/cls";
import { useCallback } from "react";

type ButtonProps = {
  onClick: () => void;
  onDisabledClick?: () => void;
  title: string;
  type?: "positive" | "negative" | "neutral" | "clear";
  isEnabled?: boolean;
  width?: "fixed" | "flexible";
  height?: "fixed" | "flexible";
  icon?: string;
  rounded?: boolean[];
};

export function Button({
  title,
  onClick: _onClick,
  onDisabledClick: _onDisClick,
  type = "neutral",
  isEnabled = true,
  width = "fixed",
  height = "fixed",
  icon,
  rounded = [true, true, true, true],
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
        rounded[0] && styles.topRight,
        rounded[1] && styles.bottomRight,
        rounded[2] && styles.bottomLeft,
        rounded[3] && styles.topLeft,
      )}
      onClick={onClick}
    >
      <div className={styles.container}>
        {icon && <img className={styles.icon} src={icon} />}
        {title}
      </div>
    </button>
  );
}

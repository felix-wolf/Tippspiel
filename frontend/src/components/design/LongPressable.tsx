import { useCallback, useRef } from "react";

type LongPressableProps = React.PropsWithChildren<{
  onLongPress: () => void; // Callback for long press
  onClick?: () => void; // Optional callback for regular click
  delay?: number; // Duration for long press (in milliseconds)
}>;

export default function LongPressable({
  children,
  onLongPress: _onLongPress,
  onClick: _onClick,
  delay,
}: LongPressableProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetRef = useRef<EventTarget | null>(null);

  const start = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      targetRef.current = event.target;

      timeoutRef.current = setTimeout(() => {
        _onLongPress();
        timeoutRef.current = null; // Clear the timeout so it doesn't fire again
      }, delay);
    },
    [_onLongPress, delay],
  );

  const clear = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      // If it's a click, ensure the long press hasn't already fired
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        if (_onClick && targetRef.current === event.target) {
          _onClick();
        }
      }
    },
    [_onClick],
  );

  return (
    <div
      onMouseDown={start}
      onMouseUp={clear}
      onMouseLeave={clear}
      onTouchStart={start}
      onTouchEnd={clear}
    >
      {children}
    </div>
  );
}

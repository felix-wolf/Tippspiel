import React, { CSSProperties, MouseEvent, useEffect, useRef } from "react";
import styles from "./Dialog.module.scss";

/**
 * Returns true if click is inside the dialog rect or if click is on (0,0), since that is a click in a <option> tag.
 * @param e the click event
 * @param element the dialog
 */
const isClickInsideRectangle = (e: MouseEvent, element: HTMLElement) => {
  const r = element.getBoundingClientRect();
  return (
    (e.clientX == 0 && e.clientY == 0) ||
    (e.clientX > r.left &&
      e.clientX < r.right &&
      e.clientY > r.top &&
      e.clientY < r.bottom)
  );
};

type Props = React.PropsWithChildren<{
  title: string;
  isOpened: boolean;
  onClose: () => void;
  style?: CSSProperties;
}>;

export function DialogModal({
  title,
  isOpened,
  onClose,
  style,
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpened) {
      ref.current?.showModal();
      document.body.classList.add("modal-open"); // prevent bg scroll
    } else {
      ref.current?.close();
      document.body.classList.remove("modal-open");
    }
  }, [isOpened]);

  return (
    <dialog
      style={style}
      className={styles.dialog}
      ref={ref}
      onCancel={onClose}
      onClick={(e) =>
        ref.current && !isClickInsideRectangle(e, ref.current) && onClose()
      }
    >
      <h3 className={styles.heading}>{title}</h3>

      {children}
    </dialog>
  );
}

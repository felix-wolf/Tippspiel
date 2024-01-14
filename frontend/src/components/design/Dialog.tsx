import React, { CSSProperties, MouseEvent, useEffect, useRef } from "react";
import styles from "./Dialog.module.scss";

const isClickInsideRectangle = (e: MouseEvent, element: HTMLElement) => {
  const r = element.getBoundingClientRect();

  return (
    e.clientX > r.left &&
    e.clientX < r.right &&
    e.clientY > r.top &&
    e.clientY < r.bottom
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

  /*
  const proceedAndClose = () => {
    onProceed();
    onClose();
  };
   */

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
      <h3>{title}</h3>

      {children}
      {/*
      <div className={styles.buttons}>
        <button onClick={proceedAndClose}>Proceed</button>
        <button onClick={onClose}>Close</button>
      </div>
      */}
    </dialog>
  );
}

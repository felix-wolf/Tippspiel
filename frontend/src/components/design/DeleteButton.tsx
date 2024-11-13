import styles from "../domain/ManualEventCreator.module.scss";
import { Shakable } from "./Shakable.tsx";
import { Button } from "./Button.tsx";
import { useState } from "react";

type DeleteButtonProps = {
  shaking: boolean;
  onFinalClick: () => void;
};

export function DeleteButton({
  shaking,
  onFinalClick: _onFinalClick,
}: DeleteButtonProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div className={styles.button}>
      <Shakable shaking={shaking}>
        {!confirmDelete && (
          <Button
            onClick={() => setConfirmDelete(true)}
            title={"Löschen"}
            type={"negative"}
            width={"flexible"}
          />
        )}
        {confirmDelete && (
          <Button
            onClick={() => {
              setConfirmDelete(false);
              _onFinalClick();
            }}
            title={"Wirklich löschen"}
            type={"negative"}
            width={"flexible"}
          />
        )}
      </Shakable>
    </div>
  );
}

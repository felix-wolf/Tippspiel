import { DialogModal } from "../design/Dialog.tsx";
import { TextField } from "../design/TextField.tsx";
import { useState } from "react";
import { Game } from "../../models/Game.ts";
import styles from "./SettingsModal.module.scss";
import { Button } from "../design/Button.tsx";
import { DeleteButton } from "../design/DeleteButton.tsx";
import { NotificationHelper } from "../../models/NotificationHelper.ts";
import { Shakable } from "../design/Shakable.tsx";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isCreator: boolean;
  game: Game;
  onGameDeleted: () => void;
  onGameUpdated: () => void;
};

export function SettingsModal({
  isOpen,
  onClose: _onClose,
  game,
  isCreator,
  onGameDeleted: _onGameDeleted,
  onGameUpdated: _onGameUpdated,
}: SettingsModalProps) {
  const [gameName, setGameName] = useState(game.name);
  const [deleteShaking, setDeleteShaking] = useState(false);
  const [pushShaking, setPushShaking] = useState(false);
  const [testPushShaking, setTestPushShaking] = useState(false);

  function buttonEnabled(): boolean {
    return gameName !== game.name;
  }

  function onDeleteGame() {
    game
      .delete()
      .then(_onGameDeleted)
      .catch(() => {
        setDeleteShaking(true);
        setTimeout(() => setDeleteShaking(false), 300);
      });
  }

  function onUpdateGameName() {
    game
      .saveNewName(gameName)
      .then(_onGameUpdated)
      .catch(() => {
        setDeleteShaking(true);
        setTimeout(() => setDeleteShaking(false), 300);
      });
  }

  return (
    <DialogModal
      title={"Einstellungen"}
      isOpened={isOpen}
      onClose={_onClose}
      style={{ height: 465 }}
    >
      <div className={styles.simpleContainer}>
        <div className={styles.row}>
          <Shakable shaking={pushShaking}>
            <Button
              onClick={() => {
                NotificationHelper.registerDevice()
                  .then((response) => {
                    console.log(response);
                  })
                  .catch((error) => {
                    console.log(error);
                    setPushShaking(true);
                    setTimeout(() => setPushShaking(false), 300);
                  });
              }}
              type={"positive"}
              title={"Push Benachrichtigungen aktivieren"}
            />
          </Shakable>
        </div>
        <div className={styles.row}>
          <Shakable shaking={testPushShaking}>
            <Button
              onClick={() => {
                NotificationHelper.sendTestNotification()
                  .then((response) => {
                    console.log(response);
                  })
                  .catch((error) => {
                    console.log(error);
                    setTestPushShaking(true);
                    setTimeout(() => setTestPushShaking(false), 300);
                  });
              }}
              type={"positive"}
              title={"Testbenachrichtigung senden"}
            />
          </Shakable>
        </div>
      </div>
      {isCreator && (
        <div className={styles.container}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
            }}
            className={styles.form}
          >
            <div className={styles.row}>
              <TextField
                onInput={(text) => setGameName(text)}
                placeholder={gameName}
                initialValue={gameName}
              />
            </div>
            <div className={styles.row}>
              <Button
                onClick={() => onUpdateGameName()}
                title={"Speichern"}
                type={"positive"}
                width={"flexible"}
                isEnabled={buttonEnabled()}
              />
              <div className={styles.button}>
                <Button
                  onClick={_onClose}
                  title={"Abbrechen"}
                  type={"neutral"}
                  width={"flexible"}
                />
              </div>
            </div>
          </form>
          <div className={styles.row}>
            <div className={styles.deleteButtonContainer}>
              <DeleteButton
                shaking={deleteShaking}
                onFinalClick={() => onDeleteGame()}
              />
            </div>
          </div>
        </div>
      )}
    </DialogModal>
  );
}

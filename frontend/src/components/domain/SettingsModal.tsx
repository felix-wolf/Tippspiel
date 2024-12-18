import { DialogModal } from "../design/Dialog.tsx";
import { TextField } from "../design/TextField.tsx";
import { useState } from "react";
import { Game } from "../../models/Game.ts";
import styles from "./SettingsModal.module.scss";
import { Button } from "../design/Button.tsx";
import { DeleteButton } from "../design/DeleteButton.tsx";
import { NotificationHelper } from "../../models/NotificationHelper.ts";

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
  const [shaking, setshaking] = useState(false);

  function buttonEnabled(): boolean {
    return gameName !== game.name;
  }

  function onDeleteGame() {
    game
      .delete()
      .then(_onGameDeleted)
      .catch(() => {
        setshaking(true);
        setTimeout(() => setshaking(false), 300);
      });
  }

  function onUpdateGameName() {
    game
      .saveNewName(gameName)
      .then(_onGameUpdated)
      .catch(() => {
        setshaking(true);
        setTimeout(() => setshaking(false), 300);
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
          <Button
            onClick={() => {
              NotificationHelper.registerDevice()
                .then((response) => {
                  console.log(response);
                })
                .catch((error) => {
                  console.log(error);
                });
            }}
            type={"positive"}
            title={"Push Benachrichtigungen aktivieren"}
          />
        </div>
        <div className={styles.row}>
          <Button
            onClick={() => {
              NotificationHelper.sendTestNotification()
                .then((response) => {
                  console.log(response);
                })
                .catch((error) => {
                  console.log(error);
                });
            }}
            type={"positive"}
            title={"Testbenachrichtigung senden"}
          />
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
                shaking={shaking}
                onFinalClick={() => onDeleteGame()}
              />
            </div>
          </div>
        </div>
      )}
    </DialogModal>
  );
}

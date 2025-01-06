import { DialogModal } from "../design/Dialog.tsx";
import { TextField } from "../design/TextField.tsx";
import { useCallback, useState } from "react";
import { Game } from "../../models/Game.ts";
import styles from "./SettingsModal.module.scss";
import { Button } from "../design/Button.tsx";
import { DeleteButton } from "../design/DeleteButton.tsx";
import {
  NotificationHelper,
  NotificationSettings,
} from "../../models/NotificationHelper.ts";
import { Shakable } from "../design/Shakable.tsx";
import checked_white from "../../assets/icons/checkbox_checked_white.svg";
import checked_black from "../../assets/icons/checkbox_checked_black.svg";
import unchecked_white from "../../assets/icons/checkbox_unchecked_white.svg";
import unchecked_black from "../../assets/icons/checkbox_unchecked_black.svg";
import { useAppearance } from "../../contexts/AppearanceContext.tsx";
import { ColorUpdater } from "./ColorUpdater.tsx";
import { useCurrentUser } from "../../models/user/UserContext.tsx";
import { cls } from "../../styles/cls.ts";
import { IconToggler } from "../design/IconToggler.tsx";
import useFetch from "../../useFetch.tsx";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isCreator: boolean;
  game: Game;
  onGameDeleted: () => void;
  onGameUpdated: () => void;
};

type SettingsItem = {
  title: string;
  subitems?: React.ReactNode[];
};

export function SettingsModal({
  isOpen,
  onClose: _onClose,
  game,
  isCreator,
  onGameDeleted: _onGameDeleted,
  onGameUpdated: _onGameUpdated,
}: SettingsModalProps) {
  const user = useCurrentUser();
  const [gameName, setGameName] = useState(game.name);
  const [deleteShaking, setDeleteShaking] = useState(false);
  const [pushShaking, setPushShaking] = useState(false);
  const [testPushShaking, setTestPushShaking] = useState(false);
  const [reminderShaking, setReminderShaking] = useState(false);
  const [resultsShaking, setResultsShaking] = useState(false);
  const [reminderState, setReminderState] = useState(0);
  const [resultsState, setResultsState] = useState(0);
  const [notificationRegisterSuccess, setNotificationRegisterSuccess] =
    useState(false);
  const { isLight } = useAppearance();
  function buttonEnabled(): boolean {
    return gameName !== game.name;
  }

  //console.log("Test");

  const settingsFetchValues = useFetch<NotificationSettings>({
    key: "notificationSettings",
    func: NotificationHelper.getSettings,
    args: [user],
  });

  const { data: settings } = settingsFetchValues;

  const buildSettingsItems = useCallback((): SettingsItem[] => {
    const colorSettingsitem: SettingsItem = {
      title: "Graph",
      subitems: [
        <ColorUpdater user={user!!} onUpdated={() => console.log("TEST")} />,
      ],
    };

    const pushSettingsItem: SettingsItem = {
      title: "Benachrichtigungen",
      subitems: [
        <>
          <Shakable shaking={pushShaking}>
            <Button
              onClick={() => {
                NotificationHelper.registerDevice()
                  .then(() => {
                    setNotificationRegisterSuccess(true);
                  })
                  .catch((error) => {
                    console.log(error);
                    setPushShaking(true);
                    setNotificationRegisterSuccess(false);
                    setTimeout(() => setPushShaking(false), 300);
                  });
              }}
              type={"positive"}
              title={"Push Benachrichtigungen aktivieren"}
            />
          </Shakable>
          {notificationRegisterSuccess && (
            <img
              src={isLight() ? checked_black : checked_white}
              alt={"checkbox"}
            />
          )}
        </>,
        <Shakable shaking={testPushShaking}>
          <Button
            onClick={() => {
              NotificationHelper.sendTestNotification(user)
                .then(() => {
                  setNotificationRegisterSuccess(true);
                })
                .catch((error) => {
                  console.log(error);
                  setTimeout(() => setTestPushShaking(false), 300);
                });
            }}
            type={"positive"}
            title={"Testbenachrichtigung senden"}
          />
        </Shakable>,
        <div className={styles.text}>Benachrichtungen erhalten bei...</div>,
        <div className={styles.notificationToggle}>
          <div className={cls(styles.settingsItemText)}>neuen Ergebnissen</div>
          <Shakable shaking={resultsShaking}>
            {settings?.reminder}
            <img src={settings?.reminder ? checked_white : unchecked_white} />
            <IconToggler
              //externallyManagedState={resultsState}
              icons={
                isLight()
                  ? [unchecked_black, checked_black]
                  : [unchecked_white, checked_white]
              }
              initialState={!!settings?.results ? 1 : 0}
              didChange={(number) => {
                console.log(number);
                NotificationHelper.saveNotificationSetting(
                  user,
                  "results",
                  number,
                )
                  .then(() => {
                    setResultsState((resultsState + 1) % 2);
                  })
                  .catch(() => {
                    setResultsShaking(true);
                    setTimeout(() => setResultsShaking(false), 300);
                  });
              }}
            />
          </Shakable>
        </div>,
        <div className={styles.notificationToggle}>
          <div className={cls(styles.settingsItemText)}>
            fehlenden Tipps (1h vorher)
          </div>
          <Shakable shaking={reminderShaking}>
            <IconToggler
              externallyManagedState={reminderState}
              icons={
                isLight()
                  ? [unchecked_black, checked_black]
                  : [unchecked_white, checked_white]
              }
              initialState={!!settings?.reminder ? 1 : 0}
              didChange={(number) => {
                NotificationHelper.saveNotificationSetting(
                  user,
                  "reminder",
                  number,
                )
                  .then(() => setReminderState((reminderState + 1) % 2))
                  .catch(() => {
                    setReminderShaking(true);
                    setTimeout(() => setReminderShaking(false), 300);
                  });
              }}
            />
          </Shakable>
        </div>,
      ],
    };
    return [colorSettingsitem, pushSettingsItem];
  }, [
    notificationRegisterSuccess,
    reminderShaking,
    settings,
    reminderState,
    resultsShaking,
    resultsState,
  ]);

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
      {buildSettingsItems().map((item, index) => (
        <div className={styles.settingItem} key={index + "a"}>
          <div className={cls(styles.settingsItemText)} key={index + "b"}>
            {item.title}
          </div>
          <div className={styles.innerItems} key={index + "c"}>
            {item.subitems?.map((innerItem, innerIndex) => (
              <div
                className={cls(styles.row, styles.innerItem)}
                key={innerIndex + "d"}
              >
                {innerItem}
              </div>
            ))}
          </div>
        </div>
      ))}

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

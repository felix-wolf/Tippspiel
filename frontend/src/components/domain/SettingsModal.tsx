import { DialogModal } from "../design/Dialog.tsx";
import { TextField } from "../design/TextField.tsx";
import { useState } from "react";
import { Game } from "../../models/Game.ts";
import {
  NotificationHelper,
  NotificationSettings,
} from "../../models/NotificationHelper.ts";
import { Shakable } from "../design/Shakable.tsx";
import { ColorUpdater } from "./ColorUpdater.tsx";
import { useCurrentUser } from "../../models/user/UserContext.tsx";
import useFetch from "../../useFetch.tsx";
import { Bell, Check, Palette } from "lucide-react";

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
  const user = useCurrentUser();
  const [gameName, setGameName] = useState(game.name);
  // const [deleteShaking, setDeleteShaking] = useState(false);
  const [pushShaking, setPushShaking] = useState(false);
  const [testPushShaking, setTestPushShaking] = useState(false);
  const [reminderShaking, setReminderShaking] = useState(false);
  const [resultsShaking, setResultsShaking] = useState(false);
  const [actionButtonShaking, setActionButtonShaking] = useState(false);
  const [notificationRegisterSuccess, setNotificationRegisterSuccess] =
    useState(false);
  const [sendTestNotificationSuccess, setSendTestNotificationSuccess] =
    useState(false);


  const settingsFetchValues = useFetch<NotificationSettings>({
    key: "notificationSettings",
    func: NotificationHelper.getSettings,
    args: [user],
  });

  const { data: settings, refetch: refetchSettings } = settingsFetchValues;

  // function onDeleteGame() {
  //   game
  //     .delete()
  //     .then(_onGameDeleted)
  //     .catch(() => {
  //       setDeleteShaking(true);
  //       setTimeout(() => setDeleteShaking(false), 300);
  //     });
  // }

  function onUpdateGameName() {
    game
      .saveNewName(gameName)
      .then(() => {
        _onGameUpdated()
        _onClose()
      })
      .catch(() => {
        setActionButtonShaking(true);
        setTimeout(() => setActionButtonShaking(false), 300);
      });
  }

  return (
    <DialogModal
      title={"Einstellungen"}
      subtitle="Tippspiel & Benachrichtigungen"
      isOpened={isOpen}
      onClose={_onClose}
      type="edit"
      onActionClick={() => onUpdateGameName()}
      actionButtonTitle={isCreator ? "Speichern" : undefined}
      actionButtonEnabled={gameName !== game.name}
      neutralButtonTitle={isCreator ? "Abbrechen" : undefined}
      onNeutralClick={_onClose}
      shakingActionButton={actionButtonShaking}
    >
      {/* GRAPH SECTION */}
      <section>
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
          <Palette size={14} />
          Graph
        </h3>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-200">
            <span className="inline-block w-4 h-4 rounded-full bg-gradient-to-r from-sky-400 to-blue-500" />
            <span>Farbschema für den Punktestand-Graphen</span>
          </div>
          {user && (
            <ColorUpdater
              user={user}
              onUpdated={_onGameUpdated}
            />
          )}
        </div>
      </section>

      {/* DIVIDER */}
      <div className="border-t border-white/10" />

      {/* NOTIFICATIONS */}
      <section>
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
          <Bell size={14} />
          Benachrichtigungen
        </h3>

        <div className="space-y-3">
          {/* Push enable */}
          <Shakable shaking={pushShaking}>
            <button onClick={() => {
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
            }} className="flex flex-row justify-center items-center gap-2 w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-2.5 text-sm font-semibold text-center shadow-md hover:from-sky-400 hover:to-blue-500 transition">
              Push-Benachrichtigungen aktivieren {notificationRegisterSuccess && (<Check className="" />)}
            </button>
          </Shakable>
          <Shakable shaking={testPushShaking}>
            <button onClick={() => {
              NotificationHelper.sendTestNotification(user)
                .then(() => {
                  setSendTestNotificationSuccess(true);
                })
                .catch((error) => {
                  console.log(error);
                  setTimeout(() => setTestPushShaking(false), 300);
                });
            }}
              className="flex flex-row justify-center items-center gap-2  w-full rounded-xl bg-slate-800 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700 transition">
              Testbenachrichtigung senden {sendTestNotificationSuccess && (<Check className="" />)}
            </button>
          </Shakable>

          <p className="mt-1 text-xs text-slate-400">
            Benachrichtigungen erhalten bei…
          </p>

          {/* Triggers */}
          <div className="space-y-2">
            <NotificationOption
              label="neuen Ergebnissen"
              enabled={settings?.results}
              shaking={resultsShaking}
              onStateChange={(newValue) => {
                NotificationHelper.saveNotificationSetting(
                  user,
                  "results",
                  newValue ? 1 : 0,
                )
                  .then(() => {
                    refetchSettings(true);
                  })
                  .catch(() => {
                    setResultsShaking(true);
                    setTimeout(() => setResultsShaking(false), 300);
                  });
              }} />
            <NotificationOption
              label="fehlenden Tipps (1h vorher)"
              enabled={settings?.reminder}
              shaking={reminderShaking}
              onStateChange={(newValue) => {
                NotificationHelper.saveNotificationSetting(
                  user,
                  "reminder",
                  newValue ? 1 : 0,
                )
                  .then(() => {
                    refetchSettings(true);
                  })
                  .catch(() => {
                    setReminderShaking(true);
                    setTimeout(() => setReminderShaking(false), 300);
                  });
              }} />
          </div>
        </div>
      </section>


      {/* GAME META */}
      {isCreator && (
        <>
          {/* DIVIDER */}
          <div className="border-t border-white/10" />
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              Spiel
            </h3>
            <label className="block text-xs mb-1 text-slate-300">
              Name des Tippspiels
            </label>
            <TextField
              onInput={(text) => setGameName(text)}
              placeholder={gameName}
              initialValue={gameName}
            />
            {/* DISABLE DELETE FOR NOW */}
            {/* <div className="w-full flex items-center justify-center">
            <DeleteButton
              shaking={deleteShaking}
              onFinalClick={() => onDeleteGame()}
            />
          </div> */}
          </section>
        </>
      )}
    </DialogModal>
  );
}

type NotificationOptionProps = {
  label: string;
  enabled?: boolean;
  onStateChange: (newValue: boolean) => void;
  shaking: boolean;
};

// small helper component for the notification list
function NotificationOption({ label, enabled, onStateChange, shaking }: NotificationOptionProps) {
  return (
    <Shakable shaking={shaking}>
      <div onClick={() => onStateChange(!enabled)} className="flex items-center justify-between rounded-xl bg-slate-800 px-3 py-2">
        <span className="text-xs text-slate-100">{label}</span>
        {enabled ? (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sky-500 text-slate-900">
            <Check size={14} />
          </span>
        ) : (
          <span className="inline-block w-4 h-4 rounded-full border border-slate-500" />
        )}
      </div>
    </Shakable>
  );
}

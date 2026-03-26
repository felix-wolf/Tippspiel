import { Mail } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DialogModal } from "../design/Dialog";
import { Shakable } from "../design/Shakable";
import { TextField } from "../design/TextField";
import { useCurrentUser, useSetCurrentUser } from "../../contexts/UserContext";
import { User } from "../../models/User";

const DISMISS_STORAGE_PREFIX = "recovery-email-prompt-dismissed:";

export function RecoveryEmailPrompt() {
  const user = useCurrentUser();
  const setCurrentUser = useSetCurrentUser();
  const [email, setEmail] = useState("");
  const [isDismissed, setIsDismissed] = useState(false);
  const [buttonShake, setButtonShake] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    if (!user) {
      setIsDismissed(false);
      return;
    }
    setIsDismissed(
      localStorage.getItem(`${DISMISS_STORAGE_PREFIX}${user.id}`) === "1",
    );
  }, [user]);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      setErrorMessage(undefined);
      setIsDismissed(false);
      localStorage.removeItem(`${DISMISS_STORAGE_PREFIX}${user.id}`);
    }
  }, [user]);

  const isOpen = useMemo(() => {
    return Boolean(user && !user.email && !isDismissed);
  }, [isDismissed, user]);

  function shakeButton(message?: string) {
    setErrorMessage(message);
    setButtonShake(true);
    setTimeout(() => setButtonShake(false), 300);
  }

  function dismissPrompt() {
    if (!user) {
      return;
    }
    localStorage.setItem(`${DISMISS_STORAGE_PREFIX}${user.id}`, "1");
    setIsDismissed(true);
  }

  function saveEmail() {
    if (email.trim() === "") {
      shakeButton("Bitte gib eine E-Mail-Adresse an.");
      return;
    }
    User.updateEmail(email)
      .then((updatedUser) => {
        setCurrentUser(updatedUser);
        setErrorMessage(undefined);
        setIsDismissed(false);
      })
      .catch((error) => {
        shakeButton(
          error?.text ?? "Die E-Mail-Adresse konnte nicht gespeichert werden.",
        );
      });
  }

  return (
    <DialogModal
      title="Recovery-Mail fehlt"
      subtitle="Lege eine E-Mail-Adresse fest, damit du dein Passwort zurücksetzen kannst."
      isOpened={isOpen}
      onClose={dismissPrompt}
      neutralButtonTitle="Später"
      onNeutralClick={dismissPrompt}
      actionButtonTitle="Speichern"
      onActionClick={saveEmail}
      actionButtonEnabled={email.trim() !== ""}
      type="edit"
      shakingActionButton={buttonShake}
    >
      <div className="space-y-4">
        <p className="text-sm leading-6 text-slate-300">
          Ohne Recovery-Mail gibt es derzeit keinen verlässlichen Weg zurück ins
          Konto, falls du dein Passwort vergisst.
        </p>
        <Shakable shaking={buttonShake}>
          <TextField
            type="email"
            placeholder="E-Mail-Adresse"
            initialValue={email}
            autoComplete="email"
            onInput={setEmail}
            icon={<Mail className="absolute left-3 top-3.5 text-gray-500" size={20} />}
          />
        </Shakable>
        {errorMessage && <p className="text-sm text-rose-300">{errorMessage}</p>}
      </div>
    </DialogModal>
  );
}

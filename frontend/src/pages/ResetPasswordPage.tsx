import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Lock as LockIcon } from "lucide-react";
import { motion } from "motion/react";

import logo from "../assets/icons/snowflake-light.svg";
import { Button } from "../components/design/Button";
import { Shakable } from "../components/design/Shakable";
import { TextField } from "../components/design/TextField";
import { SiteRoutes, useNavigateParams } from "../../SiteRoutes";
import { User } from "../models/User";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigateParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordShake, setPasswordShake] = useState(false);
  const [confirmShake, setConfirmShake] = useState(false);
  const [actionShake, setActionShake] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();

  useEffect(() => {
    if (!token) {
      setErrorMessage("Der Reset-Link ist unvollständig oder ungültig.");
    } else {
      setErrorMessage(undefined);
    }
  }, [token]);

  const isSubmitEnabled = useMemo(() => {
    return token !== "" && password.trim() !== "" && confirmPassword.trim() !== "";
  }, [confirmPassword, password, token]);

  const shakeAction = useCallback(() => {
    setActionShake(true);
    setTimeout(() => setActionShake(false), 300);
  }, []);

  const onDisabledClick = useCallback(() => {
    if (password.trim() === "") {
      setPasswordShake(true);
      setTimeout(() => setPasswordShake(false), 300);
    }
    if (confirmPassword.trim() === "") {
      setConfirmShake(true);
      setTimeout(() => setConfirmShake(false), 300);
    }
    shakeAction();
  }, [confirmPassword, password, shakeAction]);

  const onSubmit = useCallback(() => {
    if (!token) {
      setErrorMessage("Der Reset-Link ist unvollständig oder ungültig.");
      shakeAction();
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Die Passwörter stimmen nicht überein.");
      setConfirmShake(true);
      setTimeout(() => setConfirmShake(false), 300);
      shakeAction();
      return;
    }
    setErrorMessage(undefined);
    User.confirmPasswordReset(token, password)
      .then((response) => {
        setSuccessMessage(response.message);
      })
      .catch((error) => {
        setErrorMessage(error?.text ?? "Das Passwort konnte nicht zurückgesetzt werden.");
        shakeAction();
      });
  }, [confirmPassword, password, shakeAction, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-sky-200 to-blue-400 relative overflow-hidden px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="backdrop-blur-lg bg-white/30 border border-white/40 shadow-2xl rounded-3xl p-8 w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="text-sky-700 mb-3">
            <img alt={"the logo"} className="w-25 animate-[spin_5s_ease-in-out_infinite]" src={logo} />
          </div>
          <h1 className="text-3xl font-semibold text-gray-800 text-center">Neues Passwort</h1>
          <p className="text-gray-600 text-sm mt-1 text-center">
            Setze ein neues Passwort für dein Tippspiel-Konto.
          </p>
        </div>

        <div className="space-y-4">
          {!successMessage && (
            <>
              <Shakable shaking={passwordShake}>
                <TextField
                  autoComplete={"new-password"}
                  type={"password"}
                  placeholder={"Neues Passwort"}
                  onInput={(input) => {
                    setPassword(input);
                    setErrorMessage(undefined);
                  }}
                  icon={<LockIcon className="absolute left-3 top-3.5 text-gray-500" size={20} />}
                />
              </Shakable>
              <Shakable shaking={confirmShake}>
                <TextField
                  autoComplete={"new-password"}
                  type={"password"}
                  placeholder={"Passwort wiederholen"}
                  onInput={(input) => {
                    setConfirmPassword(input);
                    setErrorMessage(undefined);
                  }}
                  icon={<LockIcon className="absolute left-3 top-3.5 text-gray-500" size={20} />}
                />
              </Shakable>
            </>
          )}

          <Shakable shaking={actionShake}>
            <Button
              type={"positive"}
              title={successMessage ? "Zurück zum Login" : "Passwort speichern"}
              isEnabled={successMessage ? true : isSubmitEnabled}
              onDisabledClick={onDisabledClick}
              onClick={
                successMessage
                  ? () => navigate(SiteRoutes.Login, {})
                  : onSubmit
              }
            />
          </Shakable>

          {errorMessage && (
            <p className="text-sm text-center text-rose-700">{errorMessage}</p>
          )}
          {successMessage && (
            <p className="text-sm text-center text-emerald-700">{successMessage}</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

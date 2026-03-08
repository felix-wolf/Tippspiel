import { NetworkHelper } from "./NetworkHelper.ts";
import { getToken } from "firebase/messaging";
import { messaging } from "../main.tsx";

type settingCategory = "results" | "reminder";
export type NotificationSettings = {
  reminder: boolean;
  results: boolean;
};

export class NotificationHelper {
  public static registerDevice(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          console.log("Benachrichtigungsberechtigung erteilt.");
          getToken(messaging, {
            vapidKey:
              "BJrEvjNP4CKHuxmUsvLIQnCTD2TveRozjOgxfyESQonaZJfMcChWX67OFlJivbiqCD9Z2bIvgFQvLeUnT12zcZE",
          })
            .then((currentToken) => {
              if (currentToken) {
                console.log("Current Token:", currentToken);
                // Send the token to your server and update the UI if necessary
                NetworkHelper.post(
                  "/api/notification/register_device",
                  () => {},
                  {
                    token: currentToken,
                    platform: navigator.userAgent,
                  },
                )
                  .then(() => resolve())
                  .catch(() =>
                    reject(
                      "Das Gerät konnte nicht für Benachrichtigungen registriert werden.",
                    ),
                  );
              } else {
                // Show permission request UI
                console.log(
                  "Es konnte kein Benachrichtigungs-Token erstellt werden.",
                );
                reject(
                  "Es konnte kein Benachrichtigungs-Token erstellt werden.",
                );
              }
            })
            .catch((err) => {
              console.log("Fehler beim Laden des Benachrichtigungs-Tokens.", err);
              reject("Das Benachrichtigungs-Token konnte nicht geladen werden.");
            });
        } else {
          console.log("Benachrichtigungsberechtigung verweigert.");
          reject("Benachrichtigungen wurden nicht erlaubt.");
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  public static getSettings(): Promise<NotificationSettings> {
    return NetworkHelper.fetchAll(
      `/api/notification/settings?platform=${navigator.userAgent}`,
      (setting): NotificationSettings => {
        return {
          reminder: !!setting.reminder_notification,
          results: !!setting.results_notification,
        };
      },
    );
  }

  public static sendTestNotification(): Promise<void> {
    return NetworkHelper.post("/api/notification/test", () => {}, {
      platform: navigator.userAgent,
    });
  }

  public static saveNotificationSetting(
    setting: settingCategory,
    value: number,
  ): Promise<void> {
    return NetworkHelper.post("/api/notification/settings", () => {}, {
      platform: navigator.userAgent,
      setting: setting,
      value: value,
    });
  }
}

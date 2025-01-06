import { NetworkHelper } from "./NetworkHelper.ts";
import { getToken } from "firebase/messaging";
import { messaging } from "../main.tsx";
import { useCurrentUser } from "./user/UserContext.tsx";
import { User } from "./user/User.ts";

type settingCategory = "results" | "reminder";
export type NotificationSettings = {
  reminder: boolean;
  results: boolean;
};

export class NotificationHelper {
  public static registerDevice(): Promise<void> {
    const user = useCurrentUser();
    return new Promise<void>(async (resolve, reject) => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          console.log("NotificationHelper permission granted.");
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
                    user_id: user?.id,
                    platform: navigator.userAgent,
                  },
                )
                  .then(() => resolve())
                  .catch(() =>
                    reject(
                      "Error communicating with backend to store GCM token.",
                    ),
                  );
              } else {
                // Show permission request UI
                console.log(
                  "No registration token available. Request permission to generate one.",
                );
                reject(
                  "No registration token available. Request permission to generate one.",
                );
              }
            })
            .catch((err) => {
              console.log("An error occurred while retrieving token. ", err);
              reject("An error occurred while retrieving token. " + err.text);
            });
        } else {
          console.log("NotificationHelper permission denied.");
          reject("NotificationHelper permission denied.");
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  public static getSettings(
    user: User | undefined,
  ): Promise<NotificationSettings> {
    return NetworkHelper.fetchAll(
      `/api/notification/settings?user_id=${user?.id}&platform=${navigator.userAgent}`,
      (setting): NotificationSettings => {
        return {
          reminder: !!setting.reminder_notification,
          results: !!setting.results_notification,
        };
      },
    );
  }

  public static sendTestNotification(user: User | undefined): Promise<void> {
    return NetworkHelper.post("/api/notification/test", () => {}, {
      user_id: user?.id,
      platform: navigator.userAgent,
    });
  }

  public static saveNotificationSetting(
    user: User | undefined,
    setting: settingCategory,
    value: number,
  ): Promise<void> {
    return NetworkHelper.post("/api/notification/settings", () => {}, {
      user_id: user?.id,
      platform: navigator.userAgent,
      setting: setting,
      value: value,
    });
  }
}

import { NetworkHelper } from "./NetworkHelper.ts";
import { getToken } from "firebase/messaging";
import { messaging } from "../main.tsx";
import { useCurrentUser } from "./user/UserContext.tsx";

export class NotificationHelper {
  public static registerDevice(): Promise<boolean> {
    const user = useCurrentUser();
    return new Promise<boolean>(async (_, reject) => {
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
                return NetworkHelper.post(
                  "/api/notification/register_device",
                  () => {
                    return true;
                  },
                  {
                    token: currentToken,
                    user_id: user?.id,
                    platform: navigator.userAgent,
                  },
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

  public static sendTestNotification(): Promise<boolean> {
    const user = useCurrentUser();

    return NetworkHelper.post(
      "/api/notification/test",
      () => {
        return true;
      },
      { user_id: user?.id, platform: navigator.userAgent },
    );
  }
}

import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { apiUrl } from "./core";

const setupNotifications = async () => {
  const permissionStatus = await FirebaseMessaging.checkPermissions();
  if (permissionStatus.receive !== "granted") {
    const permissionStatus = await FirebaseMessaging.requestPermissions();
    if (permissionStatus.receive !== "granted") return;
  }
  const tokenData = await FirebaseMessaging.getToken();
  const response = await fetch(`${apiUrl}/ChangeRegister`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      provider: "FCM",
      device: tokenData.token,
      sendPush: "1",
      appVersion: 4,
    }),
  });
  const responseJson = await response.json();
  if (response.status !== 200) {
    console.error("Failed to register for notifications");
  }
  await FirebaseMessaging.addListener("notificationReceived", (event) => {
    console.log("notificationReceived", { event });
  });
  await FirebaseMessaging.addListener(
    "notificationActionPerformed",
    (event) => {
      console.log("notificationActionPerformed", { event });
    }
  );
};

export { setupNotifications };

import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface PushNotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
}

export function usePushNotifications(): PushNotificationState {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    const registerForPushNotifications = async () => {
      if (!Device.isDevice) {
        console.warn("[Notifications] Push notifications only work on physical devices");
        return;
      }

      // Android channel setup
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("le-poulet", {
          name: "Le Poulet",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#F5C518",
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("[Notifications] Permission not granted");
        return;
      }

      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: "le-poulet",
        });
        setExpoPushToken(tokenData.data);
      } catch (e) {
        console.warn("[Notifications] Could not get push token:", e);
      }
    };

    void registerForPushNotifications();

    // Listen for notifications while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((n) => {
      setNotification(n);
      console.log("[Notification] Received:", n.request.content.title);
    });

    // Listen for user tapping a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log("[Notification] Tapped:", data);
      // Navigation would happen here based on data.screen
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { expoPushToken, notification };
}

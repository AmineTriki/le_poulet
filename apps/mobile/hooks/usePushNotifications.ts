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
    const register = async () => {
      if (!Device.isDevice) {
        // Simulator — push tokens are not available; skip silently
        return;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("le-poulet", {
          name: "Le Poulet",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#F5C518",
        });
      }

      const { status: existing } = await Notifications.getPermissionsAsync();
      const { status: final } =
        existing === "granted"
          ? { status: existing }
          : await Notifications.requestPermissionsAsync();

      if (final !== "granted") return;

      // projectId must match the EAS project UUID in app.json / eas.json.
      // Falls back to the Expo slug if the env var is not set.
      const projectId =
        process.env.EXPO_PUBLIC_PROJECT_ID ?? "le-poulet";

      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        setExpoPushToken(tokenData.data);
      } catch {
        // Non-fatal — game works without push notifications
      }
    };

    void register();

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (n) => setNotification(n),
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (_response) => {
        // Deep-link handling can be added here when needed
      },
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { expoPushToken, notification };
}

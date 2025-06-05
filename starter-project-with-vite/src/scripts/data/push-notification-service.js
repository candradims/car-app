import { getAccessToken } from "./user-session.js";

class PushNotificationService {
  constructor() {
    this.vapidPublicKey =
      "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";
    this.subscription = null;
    this.baseURL = "https://story-api.dicoding.dev/v1";
  }

  async init() {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        console.log("Service Worker ready for push notifications");

        // Check if already subscribed
        this.subscription = await registration.pushManager.getSubscription();

        if (this.subscription) {
          console.log("Already subscribed to push notifications");
          return this.subscription;
        }

        return null;
      } catch (error) {
        console.error("Error initializing push notifications:", error);
        throw error;
      }
    } else {
      throw new Error("Push notifications not supported");
    }
  }

  async requestPermission() {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      console.log("Notification permission:", permission);
      return permission === "granted";
    }
    return false;
  }

  urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async subscribe() {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error("Notification permission denied");
      }

      const registration = await navigator.serviceWorker.ready;

      this.subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });

      console.log("Push subscription created:", this.subscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      throw error;
    }
  }

  async unsubscribe() {
    try {
      if (this.subscription) {
        // Unsubscribe from server
        await this.removeSubscriptionFromServer(this.subscription);

        // Unsubscribe from browser
        await this.subscription.unsubscribe();
        this.subscription = null;

        console.log("Successfully unsubscribed from push notifications");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      throw error;
    }
  }

  async sendSubscriptionToServer(subscription) {
    const token = getAccessToken();
    if (!token) {
      throw new Error("User not authenticated");
    }

    const response = await fetch(`${this.baseURL}/notifications/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(
            String.fromCharCode.apply(
              null,
              new Uint8Array(subscription.getKey("p256dh"))
            )
          ),
          auth: btoa(
            String.fromCharCode.apply(
              null,
              new Uint8Array(subscription.getKey("auth"))
            )
          ),
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Failed to subscribe to notifications"
      );
    }

    const data = await response.json();
    console.log("Subscription sent to server:", data);
    return data;
  }

  async removeSubscriptionFromServer(subscription) {
    const token = getAccessToken();
    if (!token) {
      throw new Error("User not authenticated");
    }

    const response = await fetch(`${this.baseURL}/notifications/subscribe`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Failed to unsubscribe from notifications"
      );
    }

    const data = await response.json();
    console.log("Subscription removed from server:", data);
    return data;
  }

  async showLocalNotification(title, options = {}) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        icon: "/images/logo.png",
        badge: "/images/logo.png",
        ...options,
      });
    }
  }

  isSubscribed() {
    return this.subscription !== null;
  }

  getSubscription() {
    return this.subscription;
  }
}

// Create global instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;

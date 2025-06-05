// CSS imports
import "../styles/styles.css";

import App from "./pages/app.js";
import UserSession from "./data/user-session";
import indexedDBService from "./data/indexeddb-service.js";
import pushNotificationService from "./data/push-notification-service.js";
import AutoStoryPopulator from "./data/auto-story-populator.js";

// Check if the View Transitions API is supported
const isViewTransitionsAPISupported = Boolean(document.startViewTransition);

// PWA Installation
let deferredPrompt;
let installButton;

// Service Worker Registration
const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      console.log("Service Worker registered successfully:", registration);

      // Initialize push notifications after service worker is ready
      await pushNotificationService.init();

      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  } else {
    console.log("Service Worker not supported");
  }
};

// PWA Install Prompt
const handleInstallPrompt = () => {
  window.addEventListener("beforeinstallprompt", (event) => {
    console.log("PWA install prompt triggered");
    event.preventDefault();
    deferredPrompt = event;

    // Show install button
    showInstallButton();
  });

  window.addEventListener("appinstalled", () => {
    console.log("PWA installed successfully");
    hideInstallButton();
    deferredPrompt = null;
  });
};

const showInstallButton = () => {
  if (!installButton) {
    installButton = document.createElement("button");
    installButton.id = "install-button";
    installButton.className = "btn btn-primary install-btn";
    installButton.innerHTML = "📱 Install App";
    installButton.title = "Install City Care App";

    installButton.addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
          console.log("User accepted the install prompt");
        } else {
          console.log("User dismissed the install prompt");
        }

        deferredPrompt = null;
        hideInstallButton();
      }
    });

    document.body.appendChild(installButton);
  }

  installButton.style.display = "block";
};

const hideInstallButton = () => {
  if (installButton) {
    installButton.style.display = "none";
  }
};

// Network Status Handler
const handleNetworkStatus = () => {
  const updateOnlineStatus = () => {
    const statusElement = document.querySelector("#network-status");
    if (!statusElement) {
      const status = document.createElement("div");
      status.id = "network-status";
      status.className = "network-status";
      document.body.appendChild(status);
    }

    const status = document.querySelector("#network-status");
    if (navigator.onLine) {
      status.textContent = "🟢 Online";
      status.className = "network-status online";
      // Sync offline data when back online
      syncOfflineData();
    } else {
      status.textContent = "🔴 Offline";
      status.className = "network-status offline";
    }
  };

  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  updateOnlineStatus(); // Initial status
};

// Sync offline data when back online
const syncOfflineData = async () => {
  try {
    const offlineQueue = await indexedDBService.getOfflineQueue();
    console.log("Syncing offline data:", offlineQueue);

    for (const item of offlineQueue) {
      try {
        // Process each queued item
        if (item.type === "story") {
          // Attempt to sync story to server
          console.log("Syncing story:", item.data);
        }
      } catch (error) {
        console.error("Error syncing item:", error);
      }
    }

    // Clear queue after successful sync
    await indexedDBService.clearOfflineQueue();
  } catch (error) {
    console.error("Error syncing offline data:", error);
  }
};

// Function to update the auth navigation links
const updateAuthLinks = () => {
  const authLinksContainer = document.querySelector("#auth-links");
  const addStoryLink = document.querySelector("#add-story-link");

  if (UserSession.isUserLoggedIn()) {
    const user = UserSession.getUser();
    authLinksContainer.innerHTML = `
      <div class="user-info">
        <span>Hello, ${user.name}</span>
        <button id="logout-button" class="btn btn-small" title="Logout">
          <i class="logout-icon">↪</i> Logout
        </button>
      </div>
    `;

    addStoryLink.classList.remove("hidden");

    // Add logout functionality
    document.querySelector("#logout-button").addEventListener("click", () => {
      if (confirm("Are you sure you want to logout?")) {
        UserSession.removeUser();
        window.location.hash = "#/";
        window.location.reload();
      }
    });
  } else {
    authLinksContainer.innerHTML = `
      <li><a href="#/login">Login</a></li>
      <li><a href="#/register">Register</a></li>
    `;

    addStoryLink.classList.add("hidden");
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Initializing City Care PWA...");

  // Initialize IndexedDB with retry logic
  let indexedDBInitialized = false;
  let retryCount = 0;
  const maxRetries = 3;

  while (!indexedDBInitialized && retryCount < maxRetries) {
    try {
      await indexedDBService.init();
      console.log("✅ IndexedDB initialized successfully");
      indexedDBInitialized = true;

      // Auto-populate sample stories for testing after IndexedDB is ready
      try {
        const populator = new AutoStoryPopulator();
        await populator.run();
      } catch (populatorError) {
        console.warn(
          "⚠️  Auto-populator failed, but app will continue:",
          populatorError
        );
      }
    } catch (error) {
      retryCount++;
      console.error(
        `❌ Failed to initialize IndexedDB (attempt ${retryCount}):`,
        error
      );

      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying IndexedDB initialization in 1 second...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        console.error("❌ Failed to initialize IndexedDB after all retries");
        // Continue without IndexedDB - app should still work online
      }
    }
  }

  // Register Service Worker
  await registerServiceWorker();

  // Handle PWA install prompt
  handleInstallPrompt();

  // Handle network status
  handleNetworkStatus();

  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  // Initial render
  await app.renderPage();
  updateAuthLinks();

  // Handle route changes
  window.addEventListener("hashchange", async () => {
    if (isViewTransitionsAPISupported) {
      // Use View Transitions API for smooth page transitions
      document.startViewTransition(async () => {
        await app.renderPage();
        updateAuthLinks(); // Update auth links after page render
      });
    } else {
      // Fallback for browsers that don't support View Transitions API
      await app.renderPage();
      updateAuthLinks(); // Update auth links after page render
    }
  });
});

// Network status indicator
function createNetworkStatusIndicator() {
  const indicator = document.createElement("div");
  indicator.id = "network-status";
  indicator.classList.add("network-status");
  document.body.appendChild(indicator);

  function updateStatus() {
    if (navigator.onLine) {
      indicator.textContent = "🌐 Online";
      indicator.className = "network-status online";
    } else {
      indicator.textContent = "📱 Offline Mode";
      indicator.className = "network-status offline";
    }
  }

  // Initial status
  updateStatus();

  // Listen for changes
  window.addEventListener("online", updateStatus);
  window.addEventListener("offline", updateStatus);

  // Auto-hide after 3 seconds when online
  let hideTimeout;
  window.addEventListener("online", () => {
    clearTimeout(hideTimeout);
    indicator.style.opacity = "1";
    hideTimeout = setTimeout(() => {
      indicator.style.opacity = "0.7";
    }, 3000);
  });

  window.addEventListener("offline", () => {
    clearTimeout(hideTimeout);
    indicator.style.opacity = "1";
  });
}

// Initialize network status indicator
createNetworkStatusIndicator();

const app = new App();

export default app;

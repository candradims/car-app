import StoryModel from "../../data/story-model";
import UserSession from "../../data/user-session";
import { createStoryDetailTemplate } from "../templates/story-templates";
import { parseActivePathname } from "../../routes/url-parser";
import indexedDBService from "../../data/indexeddb-service.js";

class StoryDetailPage {
  #storyId = null;
  #story = null;
  #map = null;
  #isOffline = !navigator.onLine;

  constructor() {
    // Listen for online/offline events
    window.addEventListener("online", () => {
      this.#isOffline = false;
      this.#handleNetworkStatusChange();
    });

    window.addEventListener("offline", () => {
      this.#isOffline = true;
      this.#handleNetworkStatusChange();
    });
  }

  async render() {
    return `
      <section class="container loading-container">
        <div class="loader">Loading story details...</div>
      </section>
    `;
  }

  async afterRender() {
    this.#storyId = parseActivePathname().id;

    if (!UserSession.isUserLoggedIn()) {
      this.#_redirectToLogin();
      return;
    }

    await this.#_fetchStoryDetail();

    if (this.#story) {
      this.#_renderStoryDetail();

      if (this.#story.lat && this.#story.lon) {
        this.#_initMap();
      }
    }
  }

  #handleNetworkStatusChange() {
    if (this.#isOffline) {
      this.#_showOfflineIndicator();
    } else {
      this.#_hideOfflineIndicator();
      // Try to refresh story details when coming back online
      if (this.#story && this.#storyId) {
        this.#_refreshStoryDetail();
      }
    }
  }

  async #_refreshStoryDetail() {
    try {
      const token = UserSession.getToken();
      const updatedStory = await StoryModel.getStoryById(this.#storyId, token);

      if (
        updatedStory &&
        JSON.stringify(updatedStory) !== JSON.stringify(this.#story)
      ) {
        this.#story = updatedStory;
        this.#_renderStoryDetail();
        this.#_showMessage("Story details updated", "success");
      }
    } catch (error) {
      console.log("Failed to refresh story details:", error);
    }
  }

  #_redirectToLogin() {
    const mainContent = document.querySelector("#main-content");
    mainContent.innerHTML = `
      <section class="container auth-redirect-container">
        <h2>Authentication Required</h2>
        <p>You need to be logged in to view story details.</p>
        <div class="auth-buttons">
          <a href="#/login" class="btn btn-primary">Login</a>
          <a href="#/register" class="btn btn-secondary">Register</a>
        </div>
      </section>
    `;
  }
  async #_fetchStoryDetail() {
    try {
      const token = UserSession.getToken();

      // Use StoryModel which handles offline/online logic
      this.#story = await StoryModel.getStoryById(this.#storyId, token);

      if (this.#story) {
        // Show offline indicator if we're offline
        if (this.#isOffline) {
          this.#_showOfflineIndicator();
          this.#_showMessage(
            "Viewing cached story details (Offline Mode)",
            "info"
          );
        }
        return; // Successfully got story, exit function
      }
    } catch (error) {
      console.error("Failed to fetch story detail:", error);
    }

    // If StoryModel failed, try direct IndexedDB access
    try {
      console.log("Attempting direct IndexedDB fallback...");
      const stories = await indexedDBService.getAllStories();
      const story = stories.find((s) => s.id == this.#storyId); // Use == for flexible comparison

      if (story) {
        this.#story = story;
        this.#_showOfflineIndicator();
        this.#_showMessage(
          "Viewing cached story details (Offline Mode)",
          "info"
        );
        return; // Successfully got story from IndexedDB
      }
    } catch (fallbackError) {
      console.error("IndexedDB fallback failed:", fallbackError);
    }

    // Show error if all attempts failed
    const mainContent = document.querySelector("#main-content");

    const offlineMessage = this.#isOffline
      ? "Story not available in offline cache. Please connect to internet or view this story online first to cache it."
      : "We couldn't load the story details. Please try again later.";

    mainContent.innerHTML = `
      <section class="container error-container">
        <h2>Error Loading Story</h2>
        <p>${offlineMessage}</p>
        <div class="error-actions">
          <a href="#/" class="btn btn-primary">Back to Home</a>
          ${
            !this.#isOffline
              ? '<button onclick="location.reload()" class="btn btn-secondary">Retry</button>'
              : ""
          }
        </div>
      </section>
    `;
  }
  #_showMessage(message, type = "info") {
    // Remove existing message
    const existingMessage = document.querySelector(".story-status-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageElement = document.createElement("div");
    messageElement.classList.add("story-status-message", `status-${type}`);
    messageElement.innerHTML = `
      <div class="message-content">
        <span class="message-icon">${
          type === "error" ? "⚠️" : type === "success" ? "✅" : "ℹ️"
        }</span>
        <span class="message-text">${message}</span>
        <button class="message-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Insert at the top of main content
    const mainContent = document.querySelector("#main-content");
    mainContent.insertBefore(messageElement, mainContent.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.remove();
      }
    }, 5000);
  }

  #_showOfflineIndicator() {
    // Remove existing indicator first
    this.#_hideOfflineIndicator();

    // Add offline indicator to the story detail
    const mainContent = document.querySelector("#main-content");
    const offlineIndicator = document.createElement("div");
    offlineIndicator.id = "story-offline-indicator";
    offlineIndicator.classList.add("offline-mode-indicator");
    offlineIndicator.innerHTML = `
      <div class="offline-content">
        <span class="offline-icon">📱</span>
        <span class="offline-text">Viewing cached story (Offline Mode)</span>
      </div>
    `;

    // Insert at the beginning of main content
    mainContent.insertBefore(offlineIndicator, mainContent.firstChild);
  }

  #_hideOfflineIndicator() {
    const offlineIndicator = document.querySelector("#story-offline-indicator");
    if (offlineIndicator) {
      offlineIndicator.remove();
    }
  }

  #_renderStoryDetail() {
    const mainContent = document.querySelector("#main-content");
    mainContent.innerHTML = `
      <section class="container story-detail-container">
        ${createStoryDetailTemplate(this.#story)}
      </section>
    `;
  }

  #_initMap() {
    const mapElement = document.querySelector("#detail-map");
    if (!mapElement) return;

    if (typeof L === "undefined") {
      const leafletCss = document.createElement("link");
      leafletCss.rel = "stylesheet";
      leafletCss.href = "https://unpkg.com/leaflet@1.9.3/dist/leaflet.css";
      document.head.appendChild(leafletCss);

      const leafletJs = document.createElement("script");
      leafletJs.src = "https://unpkg.com/leaflet@1.9.3/dist/leaflet.js";
      document.head.appendChild(leafletJs);

      leafletJs.onload = () => {
        this.#_initializeLeafletMap(mapElement);
      };
    } else {
      this.#_initializeLeafletMap(mapElement);
    }
  }

  #_initializeLeafletMap(mapElement) {
    // Center map on the story location
    this.#map = L.map(mapElement).setView(
      [this.#story.lat, this.#story.lon],
      15
    );

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Add marker for this story
    L.marker([this.#story.lat, this.#story.lon])
      .addTo(this.#map)
      .bindPopup(
        `
        <div class="popup-content">
          <h3>${this.#story.name}</h3>
          <p class="popup-description">${this.#story.description}</p>
        </div>
      `
      )
      .openPopup();
  }
}

export default StoryDetailPage;

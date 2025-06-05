import {
  createHomePageTemplate,
  createStoryItemTemplate,
  createStoryListSkeletonTemplate,
  createAuthPromptTemplate,
} from "../templates/story-templates";
import HomePresenter from "./home-presenter";

export default class HomePage {
  #storiesContainer = null;
  #mapElement = null;
  #map = null;
  #presenter = null;

  constructor() {
    this.#presenter = new HomePresenter(this);
  }

  async render() {
    return createHomePageTemplate();
  }

  async afterRender() {
    this.#_initElements();
    this.#_renderInitialContent();
    await this.#presenter.init();
  }

  #_initElements() {
    this.#storiesContainer = document.querySelector("#stories-container");
    this.#mapElement = document.querySelector("#map");
  }

  #_renderInitialContent() {
    if (!this.#presenter.isUserLoggedIn()) {
      this.#storiesContainer.innerHTML = createAuthPromptTemplate();
      return;
    }

    this.#storiesContainer.innerHTML = createStoryListSkeletonTemplate(5);
  }

  renderStories(stories) {
    if (!stories || stories.length === 0) {
      this.#storiesContainer.innerHTML = `
        <div class="empty-container">
          <p>No stories found. Be the first to share!</p>
          <a href="#/add" class="btn btn-primary">Add Story</a>
        </div>
      `;
      return;
    }

    this.#storiesContainer.innerHTML = "";

    // Add controls for IndexedDB management
    const controlsElement = document.createElement("div");
    controlsElement.classList.add("indexeddb-controls");
    controlsElement.innerHTML = `
      <div class="controls-header">
        <h3>Story Management</h3>
        <div class="control-buttons">
          <button id="refresh-stories" class="btn btn-secondary">🔄 Refresh</button>
          <button id="toggle-notifications" class="btn btn-secondary">🔔 Notifications</button>
        </div>
      </div>
    `;
    this.#storiesContainer.appendChild(controlsElement);

    // Add event listeners for controls
    this.#_attachControlEventListeners();

    stories.forEach((story) => {
      const storyElement = document.createElement("div");
      storyElement.classList.add("story-item");

      // Add offline indicator if story is offline-only
      const offlineIndicator = story.isOfflineOnly
        ? '<span class="offline-badge">📱 Offline</span>'
        : "";

      storyElement.innerHTML =
        createStoryItemTemplate(story) + offlineIndicator;

      // Add delete button for offline stories
      if (story.isOfflineOnly) {
        const deleteButton = document.createElement("button");
        deleteButton.classList.add(
          "btn",
          "btn-danger",
          "btn-small",
          "delete-offline-story"
        );
        deleteButton.innerHTML = "🗑️ Delete";
        deleteButton.setAttribute("data-story-id", story.id);
        storyElement.appendChild(deleteButton);
      }

      this.#storiesContainer.appendChild(storyElement);

      // Add marker if story has location data
      if (story.lat && story.lon) {
        this.#presenter.addMarker(story);
      }
    });

    // Attach delete event listeners
    this.#_attachDeleteEventListeners();
  }

  #_attachControlEventListeners() {
    const refreshButton = document.querySelector("#refresh-stories");
    const notificationButton = document.querySelector("#toggle-notifications");

    if (refreshButton) {
      refreshButton.addEventListener("click", async () => {
        refreshButton.disabled = true;
        refreshButton.textContent = "🔄 Refreshing...";

        try {
          await this.#presenter.refreshStories();
        } finally {
          refreshButton.disabled = false;
          refreshButton.textContent = "🔄 Refresh";
        }
      });
    }

    if (notificationButton) {
      notificationButton.addEventListener("click", async () => {
        try {
          // Import push notification service
          const { default: pushNotificationService } = await import(
            "../../data/push-notification-service.js"
          );

          if (pushNotificationService.isSubscribed()) {
            await pushNotificationService.unsubscribe();
            notificationButton.textContent = "🔔 Enable Notifications";
            this.showTemporaryMessage("Notifications disabled");
          } else {
            await pushNotificationService.subscribe();
            notificationButton.textContent = "🔕 Disable Notifications";
            this.showTemporaryMessage("Notifications enabled");
          }
        } catch (error) {
          console.error("Error toggling notifications:", error);
          this.showTemporaryMessage("Failed to toggle notifications", "error");
        }
      });
    }
  }

  #_attachDeleteEventListeners() {
    const deleteButtons = document.querySelectorAll(".delete-offline-story");

    deleteButtons.forEach((button) => {
      button.addEventListener("click", async (event) => {
        const storyId = parseInt(event.target.getAttribute("data-story-id"));

        if (confirm("Are you sure you want to delete this offline story?")) {
          try {
            button.disabled = true;
            button.textContent = "Deleting...";

            await this.#presenter.deleteOfflineStory(storyId);
            this.showTemporaryMessage("Story deleted successfully");
          } catch (error) {
            console.error("Error deleting story:", error);
            this.showTemporaryMessage("Failed to delete story", "error");
            button.disabled = false;
            button.textContent = "🗑️ Delete";
          }
        }
      });
    });
  }

  showTemporaryMessage(message, type = "success") {
    const messageElement = document.createElement("div");
    messageElement.classList.add("temporary-message", type);
    messageElement.textContent = message;

    document.body.appendChild(messageElement);

    setTimeout(() => {
      messageElement.remove();
    }, 3000);
  }

  showError(message) {
    this.#storiesContainer.innerHTML = `
      <div class="error-container">
        <p>${message}</p>
      </div>
    `;
  }

  showLoading() {
    const loadingElement = document.createElement("div");
    loadingElement.classList.add("loading-container");
    loadingElement.innerHTML = '<div class="loader"></div>';
    this.#storiesContainer.appendChild(loadingElement);
  }

  hideLoading() {
    const loadingElement =
      this.#storiesContainer.querySelector(".loading-container");
    if (loadingElement) {
      loadingElement.remove();
    }
  }

  async initMap() {
    if (!this.#mapElement) return null;

    // We would normally import this from an external script, but for simplicity
    // we're checking if the Leaflet library is available
    if (typeof L === "undefined") {
      // Add Leaflet CSS and JS dynamically - normally this would be in index.html
      const leafletCss = document.createElement("link");
      leafletCss.rel = "stylesheet";
      leafletCss.href = "https://unpkg.com/leaflet@1.9.3/dist/leaflet.css";
      document.head.appendChild(leafletCss);

      const leafletJs = document.createElement("script");
      leafletJs.src = "https://unpkg.com/leaflet@1.9.3/dist/leaflet.js";
      document.head.appendChild(leafletJs);

      return new Promise((resolve) => {
        leafletJs.onload = () => {
          this.#_initializeLeafletMap();
          resolve(this.#map);
        };
      });
    } else {
      this.#_initializeLeafletMap();
      return this.#map;
    }
  }

  #_initializeLeafletMap() {
    // Initialize the map centered on Indonesia
    this.#map = L.map(this.#mapElement).setView([-0.789275, 113.921327], 5);

    // Add tile layer (map design)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
  }

  createMarker(story) {
    if (!this.#map || !story.lat || !story.lon) return null;

    return L.marker([story.lat, story.lon]).addTo(this.#map).bindPopup(`
      <div class="popup-content">
        <h3>${story.name}</h3>
        <p class="popup-description">${story.description}</p>
        <a href="#/story/${story.id}" class="popup-link">View Details</a>
      </div>
    `);
  }

  showOfflineIndicator() {
    // Remove existing offline indicator
    this.hideOfflineIndicator();

    const offlineIndicator = document.createElement("div");
    offlineIndicator.id = "offline-indicator";
    offlineIndicator.classList.add("offline-mode-indicator");
    offlineIndicator.innerHTML = `
      <div class="offline-content">
        <span class="offline-icon">📱</span>
        <span class="offline-text">Viewing cached stories (Offline Mode)</span>
      </div>
    `;

    // Insert at the top of stories container
    this.#storiesContainer.insertBefore(
      offlineIndicator,
      this.#storiesContainer.firstChild
    );
  }

  hideOfflineIndicator() {
    const existingIndicator = document.querySelector("#offline-indicator");
    if (existingIndicator) {
      existingIndicator.remove();
    }
  }

  showMessage(message, type = "info") {
    // Remove existing message
    const existingMessage = document.querySelector(".status-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageElement = document.createElement("div");
    messageElement.classList.add("status-message", `status-${type}`);
    messageElement.innerHTML = `
      <div class="message-content">
        <span class="message-icon">${type === "error" ? "⚠️" : "ℹ️"}</span>
        <span class="message-text">${message}</span>
        <button class="message-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Insert at the top of stories container
    this.#storiesContainer.insertBefore(
      messageElement,
      this.#storiesContainer.firstChild
    );

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.remove();
      }
    }, 5000);
  }
}

import UserSession from "../../data/user-session";
import StoryModel from "../../data/story-model";
import indexedDBService from "../../data/indexeddb-service.js";

class HomePresenter {
  constructor(view) {
    this._view = view;
    this._stories = [];
    this._map = null;
    this._markers = [];
    this._isOffline = !navigator.onLine;

    // Listen for online/offline events
    window.addEventListener("online", () => {
      this._isOffline = false;
      this._handleNetworkStatusChange();
    });

    window.addEventListener("offline", () => {
      this._isOffline = true;
      this._handleNetworkStatusChange();
    });
  }

  async init() {
    if (UserSession.isUserLoggedIn()) {
      await this._initMap();
      await this._fetchStories();
    }
  }

  async _handleNetworkStatusChange() {
    if (this._isOffline) {
      this._view.showOfflineIndicator();
    } else {
      this._view.hideOfflineIndicator();
      // Refresh stories when coming back online
      if (UserSession.isUserLoggedIn()) {
        await this._fetchStories();
      }
    }
  }
  async _fetchStories() {
    try {
      this._view.showLoading();

      const token = UserSession.getToken();

      // Check if user is logged in
      if (!token) {
        console.log("No token available, user may not be logged in");
        this._view.showError("Please login to view stories");
        return;
      }

      console.log(
        `Fetching stories... Network: ${
          navigator.onLine ? "ONLINE" : "OFFLINE"
        }`
      );

      // Always try StoryModel first - it handles online/offline logic
      const stories = await StoryModel.getAllStories(token);

      if (stories && stories.length > 0) {
        this._stories = stories;
        this._view.renderStories(this._stories);

        // Show offline indicator if we're offline and have stories
        if (this._isOffline && stories.length > 0) {
          this._view.showOfflineIndicator();
          this._view.showMessage(
            "Showing cached stories (Offline Mode)",
            "info"
          );
        } else if (!this._isOffline) {
          console.log(`✅ Loaded ${stories.length} stories online`);
        }
      } else {
        // If no stories from StoryModel, try direct IndexedDB access as fallback
        console.log(
          "No stories from StoryModel, trying direct IndexedDB access..."
        );

        try {
          const offlineStories = await indexedDBService.getAllStories();

          if (offlineStories && offlineStories.length > 0) {
            console.log(
              `✅ Found ${offlineStories.length} stories in IndexedDB cache`
            );
            this._stories = offlineStories;
            this._view.renderStories(this._stories);
            this._view.showOfflineIndicator();
            this._view.showMessage(
              "Showing cached stories (Offline Mode)",
              "info"
            );
          } else {
            // Truly no stories available
            console.log("No stories found in any source");
            this._view.showError(
              this._isOffline
                ? "No stories cached for offline viewing. Please connect to internet and load stories first."
                : "No stories available. Please add some stories or check your connection."
            );
          }
        } catch (indexedDBError) {
          console.error("IndexedDB access failed:", indexedDBError);
          this._view.showError(
            this._isOffline
              ? "Unable to access cached stories. Please check your device storage or connect to internet."
              : "No stories available. Please add some stories or check your connection."
          );
        }
      }
    } catch (error) {
      console.error("Failed to fetch stories:", error);

      // Enhanced fallback with better error handling
      try {
        console.log(
          "Main story fetch failed, attempting IndexedDB fallback..."
        );
        const offlineStories = await indexedDBService.getAllStories();

        if (offlineStories && offlineStories.length > 0) {
          console.log(
            `✅ Fallback successful: Found ${offlineStories.length} cached stories`
          );
          this._stories = offlineStories;
          this._view.renderStories(this._stories);
          this._view.showOfflineIndicator();

          // Show a user-friendly message
          this._view.showMessage(
            "Showing cached stories (Connection issue - Offline Mode)",
            "info"
          );
        } else {
          // No cached stories available
          console.log("No cached stories available for fallback");
          this._view.showError(
            this._isOffline
              ? "No stories cached for offline viewing. Please connect to internet and load stories first."
              : "Unable to load stories. Please check your connection and try again."
          );
        }
      } catch (offlineError) {
        console.error("Failed to get offline stories:", offlineError);
        this._view.showError(
          "Unable to load stories. Please try again later or check your device storage."
        );
      }
    } finally {
      this._view.hideLoading();
    }
  }

  _mergeStories(onlineStories, offlineStories) {
    // Create a map of online stories by ID for quick lookup
    const onlineMap = new Map(onlineStories.map((story) => [story.id, story]));

    // Start with online stories
    const merged = [...onlineStories];

    // Add offline stories that aren't already online
    offlineStories.forEach((offlineStory) => {
      if (!onlineMap.has(offlineStory.id) && offlineStory.isOffline) {
        merged.push({
          ...offlineStory,
          isOfflineOnly: true, // Mark as offline-only for UI indication
        });
      }
    });

    return merged;
  }

  async _initMap() {
    this._map = await this._view.initMap();
  }

  addMarker(story) {
    if (!this._map || !story.lat || !story.lon) return;

    const marker = this._view.createMarker(story);
    this._markers.push(marker);
  }
  getStories() {
    return this._stories;
  }

  isUserLoggedIn() {
    return UserSession.isUserLoggedIn();
  }

  async deleteOfflineStory(storyId) {
    try {
      await indexedDBService.deleteStory(storyId);

      // Remove from current stories array
      this._stories = this._stories.filter((story) => story.id !== storyId);

      // Re-render stories
      this._view.renderStories(this._stories);

      return true;
    } catch (error) {
      console.error("Failed to delete offline story:", error);
      throw error;
    }
  }
  async refreshStories() {
    await this._fetchStories();
  }
}

export default HomePresenter;

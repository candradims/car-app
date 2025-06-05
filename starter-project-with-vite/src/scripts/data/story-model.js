import ApiService from "./api-service";
import UserSession from "./user-session";
import indexedDBService from "./indexeddb-service.js";

class StoryModel {
  async getAllStories(token) {
    try {
      console.log(
        `StoryModel.getAllStories - Network: ${
          navigator.onLine ? "ONLINE" : "OFFLINE"
        }`
      );

      if (navigator.onLine) {
        // Try to fetch online stories
        console.log("Attempting to fetch stories from API...");
        const response = await ApiService.getAllStories(token);
        if (response.error) {
          throw new Error(response.message);
        }

        console.log(`✅ Fetched ${response.listStory.length} stories from API`);

        // Cache stories to IndexedDB for offline access
        await this.cacheStoriesOffline(response.listStory);

        return response.listStory;
      } else {
        // Offline mode - get from IndexedDB
        console.log("Offline mode: Getting stories from IndexedDB");
        const offlineStories = await this.getOfflineStories();
        console.log(`📱 Retrieved ${offlineStories.length} offline stories`);
        return offlineStories;
      }
    } catch (error) {
      console.error(
        "Failed to get online stories, falling back to offline:",
        error
      );
      // Fallback to offline stories if online fails
      const fallbackStories = await this.getOfflineStories();
      console.log(`🔄 Fallback retrieved ${fallbackStories.length} stories`);
      return fallbackStories;
    }
  }

  async getStoryById(id, token) {
    try {
      if (navigator.onLine) {
        // Try to fetch online story
        const response = await ApiService.getStoryById(id, token);
        if (response.error) {
          throw new Error(response.message);
        }

        // Cache story details for offline access
        await this.cacheStoryDetailOffline(response.story);

        return response.story;
      } else {
        // Offline mode - get from IndexedDB
        console.log("Offline mode: Getting story detail from IndexedDB");
        return await this.getOfflineStoryById(id);
      }
    } catch (error) {
      console.error(
        "Failed to get online story, falling back to offline:",
        error
      );
      // Fallback to offline story if online fails
      return await this.getOfflineStoryById(id);
    }
  }

  async addStory({ description, photo, lat, lon, token }) {
    return await ApiService.addStory({
      description,
      photo,
      lat,
      lon,
      token,
    });
  }

  // Offline methods
  async cacheStoriesOffline(stories) {
    try {
      // Clear existing cached stories from API
      const existingStories = await indexedDBService.getAllStories();
      const onlineStoriesIds = existingStories
        .filter((story) => !story.isOffline)
        .map((story) => story.id);

      // Remove old online cached stories
      for (const id of onlineStoriesIds) {
        await indexedDBService.deleteStory(id);
      }

      // Cache new stories
      for (const story of stories) {
        await indexedDBService.addStory({
          ...story,
          isOffline: false, // Mark as cached from API
          cachedAt: new Date().toISOString(),
        });
      }

      console.log(`Cached ${stories.length} stories offline`);
    } catch (error) {
      console.error("Error caching stories offline:", error);
    }
  }

  async cacheStoryDetailOffline(story) {
    try {
      // Update existing story with full details
      await indexedDBService.updateStory(story.id, {
        ...story,
        hasFullDetails: true,
        cachedAt: new Date().toISOString(),
      });

      console.log(`Cached story detail for ID ${story.id}`);
    } catch (error) {
      console.error("Error caching story detail:", error);
      // If update fails, try to add as new story
      try {
        await indexedDBService.addStory({
          ...story,
          isOffline: false,
          hasFullDetails: true,
          cachedAt: new Date().toISOString(),
        });
      } catch (addError) {
        console.error("Error adding story detail:", addError);
      }
    }
  }
  async getOfflineStories() {
    try {
      console.log("📱 Attempting to get stories from IndexedDB...");
      const stories = await indexedDBService.getAllStories();
      console.log(
        `✅ Retrieved ${stories.length} stories from offline storage`
      );

      // Sort stories by createdAt for better UX
      stories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return stories;
    } catch (error) {
      console.error("❌ Error getting offline stories:", error);

      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  }
  async getOfflineStoryById(id) {
    try {
      const stories = await indexedDBService.getAllStories();
      // Convert id to string for comparison since URL params are strings
      const story = stories.find((story) => story.id == id); // Use == for flexible comparison

      if (!story) {
        throw new Error(`Story with ID ${id} not found in offline storage`);
      }

      console.log(`Retrieved story ${id} from offline storage`);
      return story;
    } catch (error) {
      console.error("Error getting offline story:", error);
      throw error;
    }
  }

  isUserLoggedIn() {
    return UserSession.isUserLoggedIn();
  }

  getToken() {
    return UserSession.getToken();
  }
}

export default new StoryModel();

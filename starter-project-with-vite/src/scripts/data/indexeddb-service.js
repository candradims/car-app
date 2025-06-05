class IndexedDBService {
  constructor() {
    this.dbName = "CityCaraDB";
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error("Error opening IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("IndexedDB opened successfully");
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
        console.log("IndexedDB upgrade needed");

        // Create stories object store
        if (!this.db.objectStoreNames.contains("stories")) {
          const storiesStore = this.db.createObjectStore("stories", {
            keyPath: "id",
            autoIncrement: true,
          });
          storiesStore.createIndex("createdAt", "createdAt", { unique: false });
          storiesStore.createIndex("name", "name", { unique: false });
        }

        // Create offline queue object store
        if (!this.db.objectStoreNames.contains("offlineQueue")) {
          const queueStore = this.db.createObjectStore("offlineQueue", {
            keyPath: "id",
            autoIncrement: true,
          });
          queueStore.createIndex("timestamp", "timestamp", { unique: false });
        }

        // Create user preferences object store
        if (!this.db.objectStoreNames.contains("userPreferences")) {
          this.db.createObjectStore("userPreferences", { keyPath: "key" });
        }
      };
    });
  }
  async addStory(story) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["stories"], "readwrite");
      const store = transaction.objectStore("stories");

      // Check if story already exists
      const getRequest = store.get(story.id);

      getRequest.onsuccess = () => {
        if (getRequest.result) {
          // Story exists, update it
          const updatedStory = {
            ...getRequest.result,
            ...story,
            updatedAt: new Date().toISOString(),
          };

          const updateRequest = store.put(updatedStory);

          updateRequest.onsuccess = () => {
            console.log("Story updated in IndexedDB:", story.id);
            resolve(story.id);
          };

          updateRequest.onerror = () => {
            console.error(
              "Error updating story in IndexedDB:",
              updateRequest.error
            );
            reject(updateRequest.error);
          };
        } else {
          // Story doesn't exist, add it
          const storyData = {
            ...story,
            createdAt: story.createdAt || new Date().toISOString(),
            isOffline: story.isOffline !== undefined ? story.isOffline : true,
          };

          const addRequest = store.add(storyData);

          addRequest.onsuccess = () => {
            console.log("Story added to IndexedDB:", addRequest.result);
            resolve(addRequest.result);
          };

          addRequest.onerror = () => {
            console.error("Error adding story to IndexedDB:", addRequest.error);
            reject(addRequest.error);
          };
        }
      };

      getRequest.onerror = () => {
        console.error("Error checking story existence:", getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  async getAllStories() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["stories"], "readonly");
      const store = transaction.objectStore("stories");
      const request = store.getAll();

      request.onsuccess = () => {
        console.log("Stories retrieved from IndexedDB:", request.result);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error("Error getting stories from IndexedDB:", request.error);
        reject(request.error);
      };
    });
  }

  async deleteStory(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["stories"], "readwrite");
      const store = transaction.objectStore("stories");
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log("Story deleted from IndexedDB:", id);
        resolve(id);
      };

      request.onerror = () => {
        console.error("Error deleting story from IndexedDB:", request.error);
        reject(request.error);
      };
    });
  }

  async updateStory(id, updatedStory) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["stories"], "readwrite");
      const store = transaction.objectStore("stories");

      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const existingStory = getRequest.result;
        if (existingStory) {
          const mergedStory = { ...existingStory, ...updatedStory };
          const updateRequest = store.put(mergedStory);

          updateRequest.onsuccess = () => {
            console.log("Story updated in IndexedDB:", id);
            resolve(mergedStory);
          };

          updateRequest.onerror = () => {
            console.error(
              "Error updating story in IndexedDB:",
              updateRequest.error
            );
            reject(updateRequest.error);
          };
        } else {
          reject(new Error("Story not found"));
        }
      };

      getRequest.onerror = () => {
        console.error("Error getting story from IndexedDB:", getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  async addToOfflineQueue(data) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["offlineQueue"], "readwrite");
      const store = transaction.objectStore("offlineQueue");

      const queueData = {
        ...data,
        timestamp: Date.now(),
      };

      const request = store.add(queueData);

      request.onsuccess = () => {
        console.log("Data added to offline queue:", request.result);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error("Error adding to offline queue:", request.error);
        reject(request.error);
      };
    });
  }

  async getOfflineQueue() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["offlineQueue"], "readonly");
      const store = transaction.objectStore("offlineQueue");
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async clearOfflineQueue() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["offlineQueue"], "readwrite");
      const store = transaction.objectStore("offlineQueue");
      const request = store.clear();

      request.onsuccess = () => {
        console.log("Offline queue cleared");
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async setUserPreference(key, value) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["userPreferences"], "readwrite");
      const store = transaction.objectStore("userPreferences");
      const request = store.put({ key, value });

      request.onsuccess = () => {
        resolve(value);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getUserPreference(key) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["userPreferences"], "readonly");
      const store = transaction.objectStore("userPreferences");
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

// Create global instance
const indexedDBService = new IndexedDBService();

export default indexedDBService;

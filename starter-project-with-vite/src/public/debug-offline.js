// Debug script untuk PWA offline functionality
// Jalankan script ini di browser console untuk debug masalah offline

class OfflineDebugger {
  constructor() {
    this.indexedDBService = null;
    this.storyModel = null;
  }

  async init() {
    try {
      // Import services
      const { default: indexedDBService } = await import(
        "/scripts/data/indexeddb-service.js"
      );
      const { default: storyModel } = await import(
        "/scripts/data/story-model.js"
      );
      const { default: userSession } = await import(
        "/scripts/data/user-session.js"
      );

      this.indexedDBService = indexedDBService;
      this.storyModel = storyModel;
      this.userSession = userSession;

      await this.indexedDBService.init();
      console.log("✅ Debug services initialized");

      return true;
    } catch (error) {
      console.error("❌ Failed to initialize debug services:", error);
      return false;
    }
  }

  async checkSystemStatus() {
    console.log("\n🔍 === SYSTEM STATUS CHECK ===");

    // Network status
    console.log(`📡 Network: ${navigator.onLine ? "ONLINE" : "OFFLINE"}`);

    // Service Worker
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(
        `🔧 Service Worker: ${
          registrations.length > 0 ? "REGISTERED" : "NOT REGISTERED"
        }`
      );
      if (registrations.length > 0) {
        console.log(`   - Active: ${registrations[0].active ? "YES" : "NO"}`);
        console.log(`   - Scope: ${registrations[0].scope}`);
      }
    }

    // IndexedDB
    try {
      await this.indexedDBService.init();
      console.log("💾 IndexedDB: CONNECTED");
    } catch (error) {
      console.log("💾 IndexedDB: ERROR -", error.message);
    }

    // User Session
    const isLoggedIn = this.userSession?.isUserLoggedIn();
    const token = this.userSession?.getToken();
    console.log(
      `👤 User Session: ${isLoggedIn ? "LOGGED IN" : "NOT LOGGED IN"}`
    );
    console.log(`🔑 Token: ${token ? "PRESENT" : "MISSING"}`);
  }

  async checkStoredData() {
    console.log("\n📊 === STORED DATA CHECK ===");

    try {
      const stories = await this.indexedDBService.getAllStories();
      console.log(`📚 Stored Stories: ${stories.length} found`);

      if (stories.length > 0) {
        console.log("\n📖 Story Details:");
        stories.forEach((story, index) => {
          console.log(`  ${index + 1}. ID: ${story.id}`);
          console.log(`     Name: ${story.name}`);
          console.log(
            `     Description: ${story.description?.substring(0, 50)}...`
          );
          console.log(`     Is Offline: ${story.isOffline}`);
          console.log(`     Cached At: ${story.cachedAt}`);
          console.log(`     Has Full Details: ${story.hasFullDetails}`);
          console.log("");
        });
      } else {
        console.log("⚠️  No stories found in IndexedDB");
        console.log("💡 Run `debugger.populateTestData()` to add sample data");
      }
    } catch (error) {
      console.error("❌ Error checking stored data:", error);
    }
  }

  async populateTestData() {
    console.log("\n🔄 === POPULATING TEST DATA ===");

    const testStories = [
      {
        id: "test-story-1",
        name: "Debug User 1",
        description:
          "Test story for debugging offline functionality. This story should appear when offline.",
        photoUrl: "https://picsum.photos/400/300?random=1",
        createdAt: "2024-06-05T10:00:00.000Z",
        lat: -6.2088,
        lon: 106.8456,
        isOffline: false,
        cachedAt: new Date().toISOString(),
        hasFullDetails: true,
      },
      {
        id: "test-story-2",
        name: "Debug User 2",
        description:
          "Another test story to verify offline viewing capabilities work correctly.",
        photoUrl: "https://picsum.photos/400/300?random=2",
        createdAt: "2024-06-05T09:30:00.000Z",
        lat: -6.1744,
        lon: 106.8227,
        isOffline: false,
        cachedAt: new Date().toISOString(),
        hasFullDetails: true,
      },
      {
        id: "test-story-3",
        name: "Debug User 3",
        description:
          "Third test story demonstrating PWA offline functionality is working as expected.",
        photoUrl: "https://picsum.photos/400/300?random=3",
        createdAt: "2024-06-05T08:15:00.000Z",
        lat: -6.2297,
        lon: 106.689,
        isOffline: false,
        cachedAt: new Date().toISOString(),
        hasFullDetails: true,
      },
    ];

    try {
      for (const story of testStories) {
        await this.indexedDBService.addStory(story);
        console.log(`✅ Added: ${story.name}`);
      }

      console.log(
        `\n🎉 Successfully added ${testStories.length} test stories!`
      );
      console.log("💡 Now try going offline and refresh the page");
    } catch (error) {
      console.error("❌ Error populating test data:", error);
    }
  }

  async testStoryRetrieval() {
    console.log("\n🧪 === TESTING STORY RETRIEVAL ===");

    try {
      // Test direct IndexedDB access
      console.log("🔍 Testing direct IndexedDB access...");
      const directStories = await this.indexedDBService.getAllStories();
      console.log(`   Direct IndexedDB: ${directStories.length} stories`);

      // Test StoryModel access
      console.log("🔍 Testing StoryModel access...");
      const token = this.userSession?.getToken() || "test-token";
      const modelStories = await this.storyModel.getAllStories(token);
      console.log(`   StoryModel: ${modelStories?.length || 0} stories`);

      // Test offline story retrieval
      console.log("🔍 Testing offline story retrieval...");
      const offlineStories = await this.storyModel.getOfflineStories();
      console.log(`   Offline method: ${offlineStories.length} stories`);
    } catch (error) {
      console.error("❌ Error testing story retrieval:", error);
    }
  }

  async clearAllData() {
    console.log("\n🗑️  === CLEARING ALL DATA ===");

    try {
      const stories = await this.indexedDBService.getAllStories();
      for (const story of stories) {
        await this.indexedDBService.deleteStory(story.id);
      }
      console.log(`✅ Cleared ${stories.length} stories from IndexedDB`);
    } catch (error) {
      console.error("❌ Error clearing data:", error);
    }
  }

  async runFullDiagnostic() {
    console.log("🏥 === FULL PWA DIAGNOSTIC ===\n");

    if (!(await this.init())) {
      console.log("❌ Failed to initialize debugger");
      return;
    }

    await this.checkSystemStatus();
    await this.checkStoredData();
    await this.testStoryRetrieval();

    console.log("\n📋 === RECOMMENDATIONS ===");

    const stories = await this.indexedDBService.getAllStories();
    if (stories.length === 0) {
      console.log("💡 No stories found. Run: debugger.populateTestData()");
    }

    if (!this.userSession?.isUserLoggedIn()) {
      console.log("💡 User not logged in. This might affect story loading.");
      console.log("   Try logging in first, then test offline functionality.");
    }

    if (!navigator.onLine) {
      console.log(
        "💡 Currently offline. Good for testing offline functionality!"
      );
    } else {
      console.log("💡 Currently online. To test offline:");
      console.log('   1. Open DevTools → Network → Check "Offline"');
      console.log("   2. Refresh the page");
      console.log("   3. Verify cached stories still appear");
    }
  }
}

// Auto-initialize
window.debugger = new OfflineDebugger();

console.log("🔧 PWA Offline Debugger loaded!");
console.log("📚 Available commands:");
console.log("  debugger.runFullDiagnostic() - Run complete diagnostic");
console.log("  debugger.populateTestData() - Add sample stories");
console.log("  debugger.checkSystemStatus() - Check system status");
console.log("  debugger.checkStoredData() - Check stored data");
console.log("  debugger.testStoryRetrieval() - Test story retrieval");
console.log("  debugger.clearAllData() - Clear all stored data");
console.log("\n💡 Start with: debugger.runFullDiagnostic()");

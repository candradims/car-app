// Test script untuk menambahkan sample stories ke IndexedDB
// Jalankan ini di browser console untuk populate data offline

async function populateOfflineStories() {
  try {
    // Import indexedDB service
    const { default: indexedDBService } = await import(
      "/scripts/data/indexeddb-service.js"
    );

    // Initialize IndexedDB
    await indexedDBService.init();

    // Sample stories data
    const sampleStories = [
      {
        id: "story-offline-1",
        name: "Test User 1",
        description:
          "Sample story untuk testing offline functionality. This story should be visible when the app is offline.",
        photoUrl: "https://picsum.photos/400/300?random=1",
        createdAt: "2024-01-15T10:00:00.000Z",
        lat: -6.2088,
        lon: 106.8456,
        isOffline: false,
        cachedAt: new Date().toISOString(),
        hasFullDetails: true,
      },
      {
        id: "story-offline-2",
        name: "Test User 2",
        description:
          "Another sample story for offline testing. Users should be able to view this story detail when offline.",
        photoUrl: "https://picsum.photos/400/300?random=2",
        createdAt: "2024-01-14T14:30:00.000Z",
        lat: -6.1744,
        lon: 106.8227,
        isOffline: false,
        cachedAt: new Date().toISOString(),
        hasFullDetails: true,
      },
      {
        id: "story-offline-3",
        name: "Test User 3",
        description:
          "Third sample story demonstrating offline capability. This proves the PWA functionality is working correctly.",
        photoUrl: "https://picsum.photos/400/300?random=3",
        createdAt: "2024-01-13T09:15:00.000Z",
        lat: -6.2297,
        lon: 106.689,
        isOffline: false,
        cachedAt: new Date().toISOString(),
        hasFullDetails: true,
      },
    ];

    // Add stories to IndexedDB
    for (const story of sampleStories) {
      await indexedDBService.addStory(story);
      console.log(`Added story: ${story.name}`);
    }

    console.log("✅ Sample stories added to IndexedDB successfully!");
    console.log("Now you can test offline functionality:");
    console.log('1. Go to DevTools → Network → Check "Offline"');
    console.log("2. Refresh the page");
    console.log("3. Stories should still be visible!");

    return sampleStories;
  } catch (error) {
    console.error("❌ Error populating offline stories:", error);
    throw error;
  }
}

// Auto-execute when loaded
populateOfflineStories();

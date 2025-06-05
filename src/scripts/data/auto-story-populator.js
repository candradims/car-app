// Auto-populate sample stories for PWA testing
// This script runs automatically to ensure there's always cached content for offline testing

class AutoStoryPopulator {
  constructor() {
    this.STORAGE_KEY = "citycare_stories_populated";
    this.indexedDBService = null;
  }

  async init() {
    try {
      // Import IndexedDB service
      const { default: indexedDBService } = await import(
        "./indexeddb-service.js"
      );
      this.indexedDBService = indexedDBService;

      // Ensure IndexedDB is initialized
      await this.indexedDBService.init();

      return true;
    } catch (error) {
      console.error("Failed to initialize auto-populator:", error);
      return false;
    }
  }

  async shouldPopulate() {
    try {
      // Check if we've already populated stories
      const hasPopulated = localStorage.getItem(this.STORAGE_KEY);
      if (hasPopulated) {
        console.log(
          "Stories already populated, checking if they still exist..."
        );

        // Verify stories still exist in IndexedDB
        const existingStories = await this.indexedDBService.getAllStories();
        if (existingStories.length > 0) {
          console.log(
            `Found ${existingStories.length} existing stories in cache`
          );
          return false; // No need to populate
        } else {
          console.log("No stories found in cache, will re-populate");
          return true;
        }
      }

      return true; // First time, need to populate
    } catch (error) {
      console.error("Error checking if should populate:", error);
      return true; // Default to populate on error
    }
  }

  getSampleStories() {
    const currentDate = new Date().toISOString();

    return [
      {
        id: "sample-story-1",
        name: "Jakarta City Hall",
        description:
          "Pelaporan kondisi jalan rusak di depan Balai Kota Jakarta. Lubang besar yang membahayakan pengendara motor dan mobil. Mohon segera diperbaiki untuk keselamatan masyarakat.",
        photoUrl: "https://picsum.photos/400/300?random=1",
        createdAt: "2024-06-05T08:30:00.000Z",
        lat: -6.2088,
        lon: 106.8456,
        isOffline: false,
        cachedAt: currentDate,
        hasFullDetails: true,
      },
      {
        id: "sample-story-2",
        name: "Warga Kemang",
        description:
          "Laporan kerusakan fasilitas taman di area Kemang. Beberapa permainan anak rusak dan perlu diganti. Taman ini sering digunakan warga untuk olahraga pagi dan bermain anak-anak.",
        photoUrl: "https://picsum.photos/400/300?random=2",
        createdAt: "2024-06-05T07:15:00.000Z",
        lat: -6.1744,
        lon: 106.8227,
        isOffline: false,
        cachedAt: currentDate,
        hasFullDetails: true,
      },
      {
        id: "sample-story-3",
        name: "Komunitas Kelapa Gading",
        description:
          "Pelaporan masalah drainase yang sering menyebabkan banjir di kawasan Kelapa Gading saat hujan deras. Diperlukan perbaikan sistem drainase untuk mencegah genangan air.",
        photoUrl: "https://picsum.photos/400/300?random=3",
        createdAt: "2024-06-05T06:45:00.000Z",
        lat: -6.2297,
        lon: 106.689,
        isOffline: false,
        cachedAt: currentDate,
        hasFullDetails: true,
      },
      {
        id: "sample-story-4",
        name: "Mahasiswa UI",
        description:
          "Laporan tentang kondisi trotoar yang tidak ramah penyandang disabilitas di area kampus. Perlu penambahan akses ramp dan perbaikan permukaan trotoar yang rusak.",
        photoUrl: "https://picsum.photos/400/300?random=4",
        createdAt: "2024-06-04T16:20:00.000Z",
        lat: -6.3668,
        lon: 106.8271,
        isOffline: false,
        cachedAt: currentDate,
        hasFullDetails: true,
      },
      {
        id: "sample-story-5",
        name: "Tim Lingkungan Menteng",
        description:
          "Inisiatif pembersihan lingkungan di area Menteng. Mengajak partisipasi warga untuk menjaga kebersihan dan melaporkan masalah lingkungan di sekitar area tempat tinggal.",
        photoUrl: "https://picsum.photos/400/300?random=5",
        createdAt: "2024-06-04T14:10:00.000Z",
        lat: -6.1951,
        lon: 106.8456,
        isOffline: false,
        cachedAt: currentDate,
        hasFullDetails: true,
      },
    ];
  }

  async populateStories() {
    try {
      const sampleStories = this.getSampleStories();

      console.log("🔄 Auto-populating sample stories for offline testing...");

      for (const story of sampleStories) {
        try {
          await this.indexedDBService.addStory(story);
          console.log(`✅ Added sample story: ${story.name}`);
        } catch (error) {
          console.error(`❌ Failed to add story ${story.id}:`, error);
        }
      }

      // Mark as populated
      localStorage.setItem(this.STORAGE_KEY, "true");

      console.log(
        `🎉 Successfully populated ${sampleStories.length} sample stories!`
      );
      console.log("💡 These stories will be available for offline viewing");

      return true;
    } catch (error) {
      console.error("❌ Error during auto-population:", error);
      return false;
    }
  }

  async run() {
    console.log("🏗️  Auto Story Populator starting...");

    if (!(await this.init())) {
      console.log("❌ Failed to initialize auto-populator");
      return false;
    }

    if (await this.shouldPopulate()) {
      return await this.populateStories();
    } else {
      console.log(
        "✅ Sample stories already available, skipping auto-population"
      );
      return true;
    }
  }
}

// Export for use in other modules
export default AutoStoryPopulator;

// Auto-run when module is loaded (but only if not in test environment)
if (typeof window !== "undefined" && !window.location.href.includes("test")) {
  // Run after a short delay to ensure IndexedDB is ready
  setTimeout(async () => {
    const populator = new AutoStoryPopulator();
    await populator.run();
  }, 2000);
}

import indexedDBService from "../../data/indexeddb-service.js";
import pushNotificationService from "../../data/push-notification-service.js";

class AddStoryPresenter {
  #model;
  #view;

  constructor({ model, view }) {
    this.#model = model;
    this.#view = view;
  }

  checkUserAuthentication() {
    const isLoggedIn = this.#model.isUserLoggedIn();
    if (!isLoggedIn) {
      this.#view.showAuthRedirect();
    }
    return isLoggedIn;
  }
  async submitStory({ description, photoFile, latitude, longitude }) {
    try {
      this.#view.startLoading();
      this.#view.clearErrorMessage();

      // Validate inputs
      if (!description) {
        this.#view.showErrorMessage("Please provide a description");
        return false;
      }

      if (!photoFile) {
        this.#view.showErrorMessage("Please upload or capture a photo");
        return false;
      }

      // Get token from the model
      const token = this.#model.getToken();

      // Check if online
      if (navigator.onLine) {
        try {
          // Submit story using the model
          const response = await this.#model.addStory({
            description,
            photo: photoFile,
            lat: latitude,
            lon: longitude,
            token,
          });

          if (response.error) {
            throw new Error(response.message);
          }

          // Show push notification for successful story creation
          await this.#showStoryNotification(description);

          return true;
        } catch (error) {
          // If online request fails, save to IndexedDB
          await this.#saveStoryOffline({
            description,
            photoFile,
            latitude,
            longitude,
          });

          this.#view.showErrorMessage(
            "Story saved offline. Will sync when connection is restored."
          );
          return true;
        }
      } else {
        // Save to IndexedDB for offline
        await this.#saveStoryOffline({
          description,
          photoFile,
          latitude,
          longitude,
        });

        this.#view.showErrorMessage(
          "Story saved offline. Will sync when connection is restored."
        );
        return true;
      }
    } catch (error) {
      this.#view.showErrorMessage("Failed to submit story: " + error.message);
      console.error(error);
      return false;
    } finally {
      this.#view.stopLoading();
    }
  }

  async #saveStoryOffline({ description, photoFile, latitude, longitude }) {
    try {
      // Convert photo file to base64 for storage
      const photoBase64 = await this.#fileToBase64(photoFile);

      const storyData = {
        description,
        photo: photoBase64,
        photoName: photoFile.name,
        photoType: photoFile.type,
        lat: latitude,
        lon: longitude,
        createdAt: new Date().toISOString(),
        isOffline: true,
      };

      // Save to IndexedDB
      await indexedDBService.addStory(storyData);

      // Add to offline queue for later sync
      await indexedDBService.addToOfflineQueue({
        type: "story",
        data: storyData,
      });

      console.log("Story saved offline successfully");
    } catch (error) {
      console.error("Error saving story offline:", error);
      throw error;
    }
  }

  async #fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  async #showStoryNotification(description) {
    try {
      // Show local notification
      await pushNotificationService.showLocalNotification(
        "Story berhasil dibuat",
        {
          body: `Anda telah membuat story baru dengan deskripsi: ${description.substring(
            0,
            50
          )}${description.length > 50 ? "..." : ""}`,
          icon: "/images/logo.png",
          badge: "/images/logo.png",
        }
      );
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }

  getCurrentLocation(callbacks) {
    const { onSuccess, onError } = callbacks;

    if (!navigator.geolocation) {
      onError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onSuccess(latitude, longitude);
      },
      (error) => {
        let errorMessage = "Failed to get your location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "You denied the request for geolocation";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get your location timed out";
            break;
        }

        onError(errorMessage);
      }
    );
  }
}

export default AddStoryPresenter;

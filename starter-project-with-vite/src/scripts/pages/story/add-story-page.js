import { createAddStoryTemplate } from "../templates/story-templates";
import AddStoryPresenter from "./add-story-presenter";
import StoryModel from "../../data/story-model";

class AddStoryPage {
  #presenter = null;
  #formElement = null;
  #descriptionInput = null;
  #photoInput = null;
  #latitudeInput = null;
  #longitudeInput = null;
  #submitButton = null;
  #errorMessageElement = null;

  #map = null;
  #marker = null;
  #photoFile = null;
  #cameraStream = null;

  async render() {
    return createAddStoryTemplate();
  }

  async afterRender() {
    this.#_initElements();
    this.#_initPresenter();

    if (this.#presenter.checkUserAuthentication()) {
      this.#_setupEventListeners();
      this.#_initMap();
    }
  }

  #_initPresenter() {
    this.#presenter = new AddStoryPresenter({
      model: StoryModel,
      view: this,
    });
  }

  #_initElements() {
    this.#formElement = document.querySelector("#add-story-form");
    this.#descriptionInput = document.querySelector("#description");
    this.#photoInput = document.querySelector("#photo");
    this.#latitudeInput = document.querySelector("#latitude");
    this.#longitudeInput = document.querySelector("#longitude");
    this.#submitButton = document.querySelector("#submit-button");
    this.#errorMessageElement = document.querySelector("#error-message");
  }

  #_setupEventListeners() {
    this.#formElement.addEventListener("submit", async (event) => {
      event.preventDefault();
      await this.#_submitStory();
    });

    this.#photoInput.addEventListener("change", (event) => {
      this.#_handlePhotoChange(event);
    });

    document.querySelector("#camera-btn").addEventListener("click", () => {
      this.#_startCamera();
    });

    document.querySelector("#close-camera").addEventListener("click", () => {
      this.#_stopCamera();
    });

    document.querySelector("#capture-btn").addEventListener("click", () => {
      this.#_capturePhoto();
    });

    document.querySelector("#remove-photo").addEventListener("click", () => {
      this.#_removePhoto();
    });

    document
      .querySelector("#get-current-location")
      .addEventListener("click", () => {
        this.#_getCurrentLocation();
      });

    // Handle page leave to stop camera if active
    window.addEventListener("hashchange", () => {
      this.#_stopCamera();
    });
  }

  showAuthRedirect() {
    const mainContent = document.querySelector("#main-content");
    mainContent.innerHTML = `
      <section class="container auth-redirect-container">
        <h2>Authentication Required</h2>
        <p>You need to be logged in to add a new report.</p>
        <div class="auth-buttons">
          <a href="#/login" class="btn btn-primary">Login</a>
          <a href="#/register" class="btn btn-secondary">Register</a>
        </div>
      </section>
    `;
  }

  #_initMap() {
    const mapElement = document.querySelector("#location-map");
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
    // Center map on Indonesia
    this.#map = L.map(mapElement).setView([-0.789275, 113.921327], 5);

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Add click event to set marker
    this.#map.on("click", (event) => {
      this.#_setMarkerPosition(event.latlng.lat, event.latlng.lng);
    });
  }

  #_setMarkerPosition(lat, lng) {
    if (this.#marker) {
      this.#marker.setLatLng([lat, lng]);
    } else {
      this.#marker = L.marker([lat, lng]).addTo(this.#map);
    }

    this.#latitudeInput.value = lat;
    this.#longitudeInput.value = lng;
  }

  #_getCurrentLocation() {
    this.#presenter.getCurrentLocation({
      onSuccess: (latitude, longitude) => {
        this.#_setMarkerPosition(latitude, longitude);
        this.#map.setView([latitude, longitude], 15);
      },
      onError: (errorMessage) => {
        this.showErrorMessage(errorMessage);
      },
    });
  }

  #_startCamera() {
    const cameraContainer = document.querySelector("#camera-container");
    const videoElement = document.querySelector("#camera-stream");
    const photoInputContainer = document.querySelector(
      "#photo-input-container"
    );

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.showErrorMessage("Your browser does not support camera access");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        this.#cameraStream = stream;
        videoElement.srcObject = stream;
        cameraContainer.classList.remove("hidden");

        // Hide the file input container while using camera
        if (photoInputContainer) {
          photoInputContainer.classList.add("hidden");
        }
      })
      .catch((error) => {
        console.error("Camera error:", error);
        this.showErrorMessage("Failed to access camera: " + error.message);
      });
  }

  #_stopCamera() {
    const cameraContainer = document.querySelector("#camera-container");
    const photoInputContainer = document.querySelector(
      "#photo-input-container"
    );

    if (this.#cameraStream) {
      this.#cameraStream.getTracks().forEach((track) => track.stop());
      this.#cameraStream = null;
    }

    cameraContainer.classList.add("hidden");

    // Show the file input container again when camera is closed (only if no photo captured)
    if (photoInputContainer && !this.#photoFile) {
      photoInputContainer.classList.remove("hidden");
    }
  }

  #_capturePhoto() {
    const videoElement = document.querySelector("#camera-stream");
    const canvas = document.createElement("canvas");
    const previewElement = document.querySelector("#preview-image");
    const photoPreview = document.querySelector("#photo-preview");
    const photoInputContainer = document.querySelector(
      "#photo-input-container"
    );

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        const file = new File([blob], "camera-capture.jpg", {
          type: "image/jpeg",
        });
        this.#photoFile = file;

        const imageUrl = URL.createObjectURL(blob);
        previewElement.src = imageUrl;
        previewElement.alt = "Captured photo preview";
        photoPreview.classList.remove("hidden");

        // Keep file input container hidden after capturing photo
        if (photoInputContainer) {
          photoInputContainer.classList.add("hidden");
        }

        // Make the photo field not required since we have a photo now
        if (this.#photoInput) {
          this.#photoInput.required = false;
        }

        this.#_stopCamera();
      },
      "image/jpeg",
      0.9
    );
  }

  #_handlePhotoChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    const previewElement = document.querySelector("#preview-image");
    const photoPreview = document.querySelector("#photo-preview");
    const photoInputContainer = document.querySelector(
      "#photo-input-container"
    );

    // Check file size (max 1MB)
    if (file.size > 1048576) {
      this.showErrorMessage("Photo must be less than 1MB");
      this.#photoInput.value = "";
      return;
    }

    this.#photoFile = file;
    const imageUrl = URL.createObjectURL(file);
    previewElement.src = imageUrl;
    previewElement.alt = "Selected photo preview";
    photoPreview.classList.remove("hidden");

    // Hide file input container after selecting a file
    if (photoInputContainer) {
      photoInputContainer.classList.add("hidden");
    }
  }

  #_removePhoto() {
    const photoPreview = document.querySelector("#photo-preview");
    const previewElement = document.querySelector("#preview-image");
    const photoInputContainer = document.querySelector(
      "#photo-input-container"
    );

    photoPreview.classList.add("hidden");
    previewElement.src = "";
    this.#photoFile = null;
    this.#photoInput.value = "";

    // Make the photo field required again
    if (this.#photoInput) {
      this.#photoInput.required = true;
    }

    // Show file input container again after removing photo
    if (photoInputContainer) {
      photoInputContainer.classList.remove("hidden");
    }
  }

  async #_submitStory() {
    const description = this.#descriptionInput.value.trim();
    const latitude = parseFloat(this.#latitudeInput.value) || null;
    const longitude = parseFloat(this.#longitudeInput.value) || null;

    const success = await this.#presenter.submitStory({
      description,
      photoFile: this.#photoFile,
      latitude,
      longitude,
    });

    if (success) {
      window.location.hash = "#/";
    }
  }

  startLoading() {
    this.#submitButton.disabled = true;
    this.#submitButton.textContent = "Submitting...";
  }

  stopLoading() {
    this.#submitButton.disabled = false;
    this.#submitButton.textContent = "Submit Report";
  }

  showErrorMessage(message) {
    this.#errorMessageElement.textContent = message;
    this.#errorMessageElement.classList.remove("hidden");
    this.#errorMessageElement.scrollIntoView({ behavior: "smooth" });
  }

  clearErrorMessage() {
    this.#errorMessageElement.textContent = "";
    this.#errorMessageElement.classList.add("hidden");
  }
}

export default AddStoryPage;

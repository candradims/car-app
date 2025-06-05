import { parseISO, format } from "date-fns";

const createHomePageTemplate = () => `
  <section class="container home-container">
    <div class="home-header">
      <h1>City Care App</h1>
      <p class="home-subtitle">Report and view city issues through our interactive map</p>
      <a href="#/add" class="btn btn-primary add-story-btn">Report Issue</a>
    </div>
    
    <div class="content-grid">
      <div class="map-container">
        <h2>Issues Map</h2>
        <div id="map" class="map"></div>
      </div>
      
      <div class="stories-section">
        <h2>Recent Reports</h2>
        <div id="stories-container" class="stories-container"></div>
      </div>
    </div>
  </section>
`;

const createStoryItemTemplate = (story) => {
  const createdAt = parseISO(story.createdAt);
  const formattedDate = format(createdAt, "MMM dd, yyyy");

  return `
    <article class="story-card">
      <div class="story-image-container">
        <img 
          src="${story.photoUrl}" 
          alt="Issue photo submitted by ${story.name}" 
          class="story-image"
          loading="lazy"
        />
      </div>
      
      <div class="story-content">
        <h3 class="story-title">${story.name}</h3>
        <p class="story-date">${formattedDate}</p>
        <p class="story-description">${story.description}</p>
        
        <div class="story-location">
          ${
            story.lat && story.lon
              ? `<p class="location-coordinates">
              <i class="location-icon">📍</i> 
              Lat: ${story.lat.toFixed(4)}, Lon: ${story.lon.toFixed(4)}
            </p>`
              : '<p class="no-location">No location data available</p>'
          }
        </div>
        
        <a href="#/story/${
          story.id
        }" class="btn btn-secondary view-detail-btn">View Details</a>
      </div>
    </article>
  `;
};

const createStoryListSkeletonTemplate = (count) => {
  let skeletonItems = "";

  for (let i = 0; i < count; i++) {
    skeletonItems += `
      <div class="story-card skeleton">
        <div class="story-image-container skeleton-image"></div>
        <div class="story-content">
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-line skeleton-date"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-button"></div>
        </div>
      </div>
    `;
  }

  return skeletonItems;
};

const createAuthPromptTemplate = () => `
  <div class="auth-prompt">
    <h2>Please login to view reports</h2>
    <p>You need to be logged in to see reports and access the city care platform</p>
    <div class="auth-buttons">
      <a href="#/login" class="btn btn-primary">Login</a>
      <a href="#/register" class="btn btn-secondary">Register</a>
    </div>
  </div>
`;

const createStoryDetailTemplate = (story) => {
  const createdAt = parseISO(story.createdAt);
  const formattedDate = format(createdAt, "MMMM dd, yyyy HH:mm");

  return `
    <article class="story-detail">
      <h1 class="story-title">${story.name}'s Report</h1>
      
      <div class="story-meta">
        <p class="story-date">Posted on ${formattedDate}</p>
      </div>
      
      <div class="story-image-container detail-image">
        <img 
          src="${story.photoUrl}" 
          alt="Issue photo submitted by ${story.name}" 
          class="story-detail-image"
        />
      </div>
      
      <div class="story-content">
        <h2>Description</h2>
        <p class="story-description">${story.description}</p>
        
        <h2>Location</h2>
        ${
          story.lat && story.lon
            ? `<div id="detail-map" class="detail-map"></div>
           <p class="location-coordinates">
             <i class="location-icon">📍</i> 
             Latitude: ${story.lat.toFixed(6)}, Longitude: ${story.lon.toFixed(
                6
              )}
           </p>`
            : '<p class="no-location">No location data available for this report</p>'
        }
      </div>
      
      <div class="action-buttons">
        <a href="#/" class="btn btn-secondary">Back to Home</a>
      </div>
    </article>
  `;
};

const createAddStoryTemplate = () => `
  <section class="container add-story-container">
    <h1>Report an Issue</h1>
    
    <div id="error-message" class="error-message hidden" aria-live="polite"></div>
    
    <form id="add-story-form" class="add-story-form">
      <div class="form-group">
        <label for="description">Description</label>
        <textarea 
          id="description" 
          name="description" 
          rows="4" 
          placeholder="Describe the issue you want to report" 
          required
        ></textarea>
      </div>
      
      <div class="form-group">
        <label for="photo">Photo</label>
        <div id="photo-input-container" class="photo-input-container">
          <input 
            type="file" 
            id="photo" 
            name="photo" 
            accept="image/*" 
            required
            aria-describedby="photo-help"
          >
          <button type="button" id="camera-btn" class="btn btn-secondary camera-btn">
            Use Camera
          </button>
        </div>
        <p id="photo-help" class="form-help">
          Please upload an image of the issue (max 1MB)
        </p>
        
        <div id="photo-preview" class="photo-preview hidden">
          <img id="preview-image" src="" alt="Preview of the photo to upload">
          <button type="button" id="remove-photo" class="remove-photo">
            Remove
          </button>
        </div>
        
        <div id="camera-container" class="camera-container hidden">
          <video id="camera-stream" autoplay></video>
          <button type="button" id="capture-btn" class="btn btn-primary capture-btn">
            Capture Photo
          </button>
          <button type="button" id="close-camera" class="btn btn-secondary close-camera">
            Cancel
          </button>
        </div>
      </div>
      
      <div class="form-group">
        <label for="location">Location</label>
        <div id="location-map" class="location-map"></div>
        <p class="form-help">
          Click on the map to set the location or use the button below
        </p>
        <div class="location-inputs">
          <div class="form-group">
            <label for="latitude">Latitude</label>
            <input type="number" id="latitude" name="latitude" step="any">
          </div>
          <div class="form-group">
            <label for="longitude">Longitude</label>
            <input type="number" id="longitude" name="longitude" step="any">
          </div>
        </div>
        <button type="button" id="get-current-location" class="btn btn-secondary">
          Use My Current Location
        </button>
      </div>
      
      <button type="submit" id="submit-button" class="btn btn-primary">
        Submit Report
      </button>
    </form>
  </section>
`;

export {
  createHomePageTemplate,
  createStoryItemTemplate,
  createStoryListSkeletonTemplate,
  createAuthPromptTemplate,
  createStoryDetailTemplate,
  createAddStoryTemplate,
};

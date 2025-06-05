import CONFIG from "../config";

class ApiService {
  static async register({ name, email, password }) {
    const response = await fetch(`${CONFIG.BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    return response.json();
  }

  static async login({ email, password }) {
    const response = await fetch(`${CONFIG.BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    return response.json();
  }

  static async getAllStories(token, page = 1, size = 10, location = 1) {
    const response = await fetch(
      `${CONFIG.BASE_URL}/stories?page=${page}&size=${size}&location=${location}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.json();
  }

  static async getStoryDetail(id, token) {
    const response = await fetch(`${CONFIG.BASE_URL}/stories/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.json();
  }

  static async addStory({ description, photo, lat, lon, token }) {
    const formData = new FormData();
    formData.append("description", description);
    formData.append("photo", photo);

    if (lat) formData.append("lat", lat);
    if (lon) formData.append("lon", lon);

    const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    return response.json();
  }

  static async addStoryAsGuest({ description, photo, lat, lon }) {
    const formData = new FormData();
    formData.append("description", description);
    formData.append("photo", photo);

    if (lat) formData.append("lat", lat);
    if (lon) formData.append("lon", lon);

    const response = await fetch(`${CONFIG.BASE_URL}/stories/guest`, {
      method: "POST",
      body: formData,
    });

    return response.json();
  }
}

export default ApiService;

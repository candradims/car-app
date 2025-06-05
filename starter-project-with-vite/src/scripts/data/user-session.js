class UserSession {
  static #KEY = "city_care_user";

  static saveUser(user) {
    localStorage.setItem(this.#KEY, JSON.stringify(user));
  }

  static getUser() {
    const user = localStorage.getItem(this.#KEY);
    return user ? JSON.parse(user) : null;
  }

  static removeUser() {
    localStorage.removeItem(this.#KEY);
  }

  static isUserLoggedIn() {
    return !!this.getUser();
  }

  static getToken() {
    const user = this.getUser();
    return user ? user.token : null;
  }
}

// Export function for push notification service
export const getAccessToken = () => {
  return UserSession.getToken();
};

export default UserSession;

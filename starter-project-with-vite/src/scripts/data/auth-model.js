import ApiService from "./api-service";
import UserSession from "./user-session";

class AuthModel {
  async register({ name, email, password }) {
    return await ApiService.register({ name, email, password });
  }

  async login({ email, password }) {
    return await ApiService.login({ email, password });
  }

  saveUserSession(token, user) {
    UserSession.set(token, user);
  }

  isUserLoggedIn() {
    return UserSession.isUserLoggedIn();
  }

  getToken() {
    return UserSession.getToken();
  }

  clearUserSession() {
    UserSession.remove();
  }
}

export default new AuthModel();

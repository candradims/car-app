import ApiService from "../../data/api-service";
import UserSession from "../../data/user-session";
import { createLoginTemplate } from "../templates/auth-templates";

class LoginPage {
  #loginFormElement = null;
  #emailInputElement = null;
  #passwordInputElement = null;
  #submitButtonElement = null;
  #errorMessageElement = null;

  async render() {
    return createLoginTemplate();
  }

  async afterRender() {
    this.#_initElements();
    this.#_setupEventListeners();
    this.#_checkUserAuthentication();
  }

  #_initElements() {
    this.#loginFormElement = document.querySelector("#login-form");
    this.#emailInputElement = document.querySelector("#email");
    this.#passwordInputElement = document.querySelector("#password");
    this.#submitButtonElement = document.querySelector("#submit-button");
    this.#errorMessageElement = document.querySelector("#error-message");
  }

  #_setupEventListeners() {
    this.#loginFormElement.addEventListener("submit", async (event) => {
      event.preventDefault();
      await this.#_login();
    });
  }

  #_checkUserAuthentication() {
    if (UserSession.isUserLoggedIn()) {
      window.location.hash = "#/";
    }
  }

  async #_login() {
    try {
      this.#_startLoading();
      this.#_clearErrorMessage();

      const email = this.#emailInputElement.value;
      const password = this.#passwordInputElement.value;

      const response = await ApiService.login({ email, password });

      if (response.error) {
        this.#_showErrorMessage(response.message);
        return;
      }

      UserSession.saveUser({
        id: response.loginResult.userId,
        name: response.loginResult.name,
        token: response.loginResult.token,
      });

      window.location.hash = "#/";
    } catch (error) {
      this.#_showErrorMessage(
        "An error occurred while logging in. Please try again."
      );
      console.error(error);
    } finally {
      this.#_stopLoading();
    }
  }

  #_startLoading() {
    this.#submitButtonElement.disabled = true;
    this.#submitButtonElement.textContent = "Logging in...";
  }

  #_stopLoading() {
    this.#submitButtonElement.disabled = false;
    this.#submitButtonElement.textContent = "Login";
  }

  #_showErrorMessage(message) {
    this.#errorMessageElement.textContent = message;
    this.#errorMessageElement.classList.remove("hidden");
  }

  #_clearErrorMessage() {
    this.#errorMessageElement.textContent = "";
    this.#errorMessageElement.classList.add("hidden");
  }
}

export default LoginPage;

import { createRegisterTemplate } from "../templates/auth-templates";
import RegisterPresenter from "./register-presenter";
import AuthModel from "../../data/auth-model";

class RegisterPage {
  #presenter = null;
  #registerFormElement = null;
  #nameInputElement = null;
  #emailInputElement = null;
  #passwordInputElement = null;
  #submitButtonElement = null;
  #errorMessageElement = null;

  async render() {
    return createRegisterTemplate();
  }

  async afterRender() {
    this.#_initElements();
    this.#_initPresenter();
    this.#_setupEventListeners();
    this.#presenter.checkUserAuthentication();
  }

  #_initElements() {
    this.#registerFormElement = document.querySelector("#register-form");
    this.#nameInputElement = document.querySelector("#name");
    this.#emailInputElement = document.querySelector("#email");
    this.#passwordInputElement = document.querySelector("#password");
    this.#submitButtonElement = document.querySelector("#submit-button");
    this.#errorMessageElement = document.querySelector("#error-message");
  }

  #_initPresenter() {
    this.#presenter = new RegisterPresenter({
      model: AuthModel,
      view: this,
    });
  }

  #_setupEventListeners() {
    this.#registerFormElement.addEventListener("submit", async (event) => {
      event.preventDefault();
      await this.#_register();
    });
  }

  async #_register() {
    const name = this.#nameInputElement.value;
    const email = this.#emailInputElement.value;
    const password = this.#passwordInputElement.value;

    const success = await this.#presenter.register({ name, email, password });

    if (success) {
      window.location.hash = "#/login";
    }
  }

  startLoading() {
    this.#submitButtonElement.disabled = true;
    this.#submitButtonElement.textContent = "Registering...";
  }

  stopLoading() {
    this.#submitButtonElement.disabled = false;
    this.#submitButtonElement.textContent = "Register";
  }

  showErrorMessage(message) {
    this.#errorMessageElement.textContent = message;
    this.#errorMessageElement.classList.remove("hidden");
  }

  clearErrorMessage() {
    this.#errorMessageElement.textContent = "";
    this.#errorMessageElement.classList.add("hidden");
  }
}

export default RegisterPage;

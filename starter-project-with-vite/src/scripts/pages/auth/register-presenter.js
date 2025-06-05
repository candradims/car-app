class RegisterPresenter {
  #model;
  #view;

  constructor({ model, view }) {
    this.#model = model;
    this.#view = view;
  }

  checkUserAuthentication() {
    if (this.#model.isUserLoggedIn()) {
      window.location.hash = "#/";
    }
  }

  async register({ name, email, password }) {
    try {
      this.#view.startLoading();
      this.#view.clearErrorMessage();

      // Validate password
      if (password.length < 8) {
        this.#view.showErrorMessage("Password must be at least 8 characters");
        return false;
      }

      // Call the model to register the user
      const response = await this.#model.register({ name, email, password });

      if (response.error) {
        this.#view.showErrorMessage(response.message);
        return false;
      }

      return true;
    } catch (error) {
      this.#view.showErrorMessage(
        "An error occurred while registering. Please try again."
      );
      console.error(error);
      return false;
    } finally {
      this.#view.stopLoading();
    }
  }
}

export default RegisterPresenter;

const createLoginTemplate = () => `
  <section class="container auth-container">
    <h1 class="auth-title">Login to Your Account</h1>
    
    <div id="error-message" class="error-message hidden" aria-live="polite"></div>
    
    <form id="login-form" class="auth-form">
      <div class="form-group">
        <label for="email">Email</label>
        <input 
          type="email" 
          id="email" 
          name="email" 
          placeholder="Enter your email" 
          required
          autocomplete="email"
        >
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input 
          type="password" 
          id="password" 
          name="password" 
          placeholder="Enter your password" 
          required
          autocomplete="current-password"
        >
      </div>
      
      <button type="submit" id="submit-button" class="btn btn-primary">Login</button>
    </form>
    
    <p class="auth-redirect">
      Don't have an account? <a href="#/register">Register Here</a>
    </p>
  </section>
`;

const createRegisterTemplate = () => `
  <section class="container auth-container">
    <h1 class="auth-title">Create a New Account</h1>
    
    <div id="error-message" class="error-message hidden" aria-live="polite"></div>
    
    <form id="register-form" class="auth-form">
      <div class="form-group">
        <label for="name">Name</label>
        <input 
          type="text" 
          id="name" 
          name="name" 
          placeholder="Enter your name" 
          required
          autocomplete="name"
        >
      </div>
      
      <div class="form-group">
        <label for="email">Email</label>
        <input 
          type="email" 
          id="email" 
          name="email" 
          placeholder="Enter your email" 
          required
          autocomplete="email"
        >
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input 
          type="password" 
          id="password" 
          name="password" 
          placeholder="Enter your password (min. 8 characters)" 
          required
          autocomplete="new-password"
          minlength="8"
        >
      </div>
      
      <button type="submit" id="submit-button" class="btn btn-primary">Register</button>
    </form>
    
    <p class="auth-redirect">
      Already have an account? <a href="#/login">Login Here</a>
    </p>
  </section>
`;

export { createLoginTemplate, createRegisterTemplate };

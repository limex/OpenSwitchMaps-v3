// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create the Vue app after Vue is loaded
  const { createApp } = Vue;
  const app = createApp({
    // Your Options component logic goes here
  });

  // Mount the app
  app.mount('#options');
});

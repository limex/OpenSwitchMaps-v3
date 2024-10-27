// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create the Vue app using the global Vue object
  Vue.createApp({
    // Define your component options here
    // This is a simplified version of your Popup component
    template: `
      <div>
        <!-- Your popup content goes here -->
        <h1>OpenSwitchMaps Popup</h1>
        <!-- Add more elements as needed -->
      </div>
    `,
    // Add any necessary component logic here
  }).mount('#popup');
});

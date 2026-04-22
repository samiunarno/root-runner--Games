import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // Add allowed hosts here
    allowedHosts: [
      'goodly-rea-furthermore.ngrok-free.dev',  // Your Ngrok URL
      // Add any other domains you might need to allow here
    ],
    // Optional: You can add other server settings if needed
    host: '0.0.0.0', // This makes the server accessible on your local network (useful for Ngrok)
    port: 3000, // The port your server will run on (optional, adjust as needed)
    strictPort: true, // If true, Vite will fail to start if the port is already in use
  },
  // Other Vite configuration settings (if needed)
});
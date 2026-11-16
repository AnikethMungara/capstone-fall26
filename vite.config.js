import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" keeps asset paths relative so the build can be hosted
// inside a Unity WebGL template or a WebView later.
export default defineConfig({
  base: "./",
  plugins: [react()],
});

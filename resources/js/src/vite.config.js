import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import laravel from "laravel-vite-plugin";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        laravel({
            input: ["resources/css/app.css", "resources/js/src/main.jsx"],
            refresh: true,
        }),
        // UBAH BAGIAN INI:
        react({
            jsxRuntime: "classic",
        }),
    ],
});

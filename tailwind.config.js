/* eslint-disable no-undef */
module.exports = {
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    "Plus Jakarta Sans",
                    "ui-sans-serif",
                    "system-ui",
                    "-apple-system",
                    "Segoe UI",
                    "Roboto",
                    "Helvetica Neue",
                    "Arial",
                    "Noto Sans",
                    "Apple Color Emoji",
                    "Segoe UI Emoji",
                    "Segoe UI Symbol",
                    "Noto Color Emoji",
                ],
            },
        },
    },
    // Tambahkan daisyui di sini
    plugins: [require("daisyui")],

    // Kunci tema agar tidak berubah menjadi gelap (hitam)
    daisyui: {
        themes: ["light"], // Memaksa aplikasi hanya menggunakan tema terang
        darkTheme: "light", // Menonaktifkan otomatis dark mode
    },
};
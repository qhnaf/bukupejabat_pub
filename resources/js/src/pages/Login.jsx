import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // JANGAN LUPA: npm install axios
import BgImage from "../assets/images/gedung-pancasila.jpg";

export default function Login({ onLogin }) {
    const navigate = useNavigate();

    // State Input
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    // State loading agar user tahu sedang memproses (Opsional, tidak merubah tampilan dasar)
    const [isLoading, setIsLoading] = useState(false);

    // --- CAPTCHA STATE ---
    const [captchaInput, setCaptchaInput] = useState("");
    const [captchaAnswer, setCaptchaAnswer] = useState(null);
    const [captchaError, setCaptchaError] = useState("");
    const canvasRef = React.useRef(null);

    // Generate CAPTCHA soal matematika dan gambar di canvas
    const generateCaptcha = React.useCallback(() => {
        const ops = ['+', '-'];
        const op = ops[Math.floor(Math.random() * ops.length)];
        let a = Math.floor(Math.random() * 9) + 1;
        let b = Math.floor(Math.random() * 9) + 1;
        if (op === '-' && b > a) [a, b] = [b, a]; // pastikan hasil positif
        const answer = op === '+' ? a + b : a - b;
        const text = `${a}  ${op}  ${b}  =  ?`;
        setCaptchaAnswer(answer);
        setCaptchaInput("");
        setCaptchaError("");

        // Gambar di canvas
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;

        // Background
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, W, H);

        // Noise dots
        for (let i = 0; i < 40; i++) {
            ctx.beginPath();
            ctx.arc(
                Math.random() * W,
                Math.random() * H,
                Math.random() * 1.5,
                0, Math.PI * 2
            );
            ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 75%)`;
            ctx.fill();
        }

        // Noise lines
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * W, Math.random() * H);
            ctx.lineTo(Math.random() * W, Math.random() * H);
            ctx.strokeStyle = `hsl(${Math.random() * 360}, 40%, 80%)`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }

        // Teks soal
        ctx.font = 'bold 22px monospace';
        ctx.textBaseline = 'middle';
        // Gambar huruf satu per satu dengan rotasi sedikit berbeda agar lebih sulit dibaca bot
        const chars = text.split('');
        let x = 12;
        chars.forEach((ch) => {
            const rotation = (Math.random() - 0.5) * 0.25;
            ctx.save();
            ctx.translate(x, H / 2 + (Math.random() - 0.5) * 4);
            ctx.rotate(rotation);
            ctx.fillStyle = `hsl(${200 + Math.random() * 40}, 60%, 30%)`;
            ctx.fillText(ch, 0, 0);
            ctx.restore();
            x += ch === ' ' ? 6 : 18;
        });
    }, []);

    // Generate saat komponen pertama kali muncul
    React.useEffect(() => {
        generateCaptcha();
    }, [generateCaptcha]);

    // --- LOGIC BARU (TERHUBUNG DATABASE) ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setError(""); // Reset error lama
        setEmailError("");
        setPasswordError("");
        setCaptchaError("");

        // Validasi CAPTCHA sebelum kirim ke server
        if (parseInt(captchaInput, 10) !== captchaAnswer) {
            generateCaptcha(); // refresh soal dulu (akan reset captchaError ke "")
            setCaptchaError("Jawaban CAPTCHA salah. Silakan coba lagi."); // lalu set error agar tampil
            return;
        }

        setIsLoading(true); // Mulai proses

        try {
            // 1. TEMBAK API LARAVEL
            const response = await axios.post(
                "/api/login",
                {
                    email: email,
                    password: password,
                },
            );

            // 2. JIKA SUKSES
            if (response.data.success) {
                const { token, user, permissions } = response.data.data;

                // 3. SIMPAN DATA DARI DATABASE KE BROWSER
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user)); // SIMPAN UTUH
                localStorage.setItem("permissions", JSON.stringify(permissions));
                localStorage.setItem("user_role", user.role);
                localStorage.setItem("user_id", user.id);
                localStorage.setItem("user_name", user.username);
                localStorage.setItem(
                    "user_divisi",
                    user.unit_kerja?.nama_unit_kerja || "Pusat",
                );

                // 4. UPDATE STATE LOGIN UTAMA (APP.JSX)
                if (onLogin) onLogin();

                // 5. PINDAH KE DASHBOARD
                navigate("/dashboard");
            }
        } catch (err) {
            console.error("Login Error:", err);
            const errType = err.response?.data?.error_type;
            const errMsg  = err.response?.data?.message || "Login Gagal. Periksa Email/Password atau Server.";

            if (errType === 'email') {
                setEmailError(errMsg);
            } else if (errType === 'password') {
                setPasswordError(errMsg);
            } else {
                setError(errMsg);
            }
            // Refresh captcha setiap kali login gagal
            generateCaptcha();
        } finally {
            setIsLoading(false); // Selesai proses
        }
    };
    // ---------------------------------------

    return (
        <div
            className="relative min-h-screen flex items-center justify-center p-6"
            style={{
                backgroundImage: `url(${BgImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {/* TAMPILAN TETAP SAMA (Z-INDEX SUDAH BENAR) */}
            <div className="absolute inset-0 bg-black/40 z-0" />

            <div className="relative w-full max-w-md z-20">
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                    <div className="px-8 py-10">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-12 w-12 rounded-xl bg-sky-500 flex items-center justify-center text-white font-bold text-lg">
                                A
                            </div>
                            <div>
                                <h1 className="text-2xl font-extrabold text-slate-900">
                                    Buku Pejabat
                                </h1>
                                <p className="text-sm text-slate-500">
                                    Sign in to your admin account
                                </p>
                            </div>
                        </div>

                        {/* Pesan Error */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 text-red-600 text-sm rounded-lg border border-red-200">
                                {error}
                            </div>
                        )}

                        <form className="space-y-4" onSubmit={handleLogin}>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                                    // Placeholder contoh pakai akun database
                                    placeholder="sdm@kemenlu.go.id"
                                    className={`w-full px-4 py-3 rounded-xl border bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-300 ${
                                        emailError ? 'border-red-400 focus:ring-red-300' : 'border-slate-200'
                                    }`}
                                    required
                                    disabled={isLoading}
                                />
                                {emailError && (
                                    <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5 flex-shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>
                                        {emailError}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                                        placeholder="Enter password"
                                        className={`w-full px-4 py-3 rounded-xl border bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-300 ${
                                            passwordError ? 'border-red-400 focus:ring-red-300' : 'border-slate-200'
                                        }`}
                                        required
                                        disabled={isLoading}
                                    />
                                {passwordError && (
                                    <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5 flex-shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>
                                        {passwordError}
                                    </p>
                                )}
                                </div>
                            </div>

                            {/* ── CAPTCHA ─────────────────────────────────── */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-2">
                                    Verifikasi — Selesaikan soal berikut
                                </label>

                                {/* Baris 1: Canvas soal + tombol refresh */}
                                <div className="flex items-stretch gap-2 mb-2">
                                    <canvas
                                        ref={canvasRef}
                                        width={220}
                                        height={46}
                                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 select-none"
                                        style={{ userSelect: 'none', display: 'block' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={generateCaptcha}
                                        title="Ganti soal"
                                        className="flex-shrink-0 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Baris 2: Input jawaban (full width) */}
                                <input
                                    type="number"
                                    value={captchaInput}
                                    onChange={(e) => setCaptchaInput(e.target.value)}
                                    placeholder="Ketik jawaban di sini..."
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-sky-300"
                                    required
                                    disabled={isLoading}
                                />

                                {captchaError && (
                                    <p className="text-xs text-red-500 mt-1.5 font-medium">{captchaError}</p>
                                )}
                            </div>
                            {/* ─────────────────────────────────────────────── */}


                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`btn w-full rounded-xl text-white font-semibold mt-4 cursor-pointer transition-colors py-3
                                        ${isLoading ? "bg-slate-400 cursor-not-allowed" : "btn-info hover:bg-sky-600"}
                                    `}
                                >
                                    {isLoading ? "Memproses..." : "Sign in"}
                                </button>
                            </div>
                        </form>

                        <div className="px-8 py-4 mt-6 border-t border-slate-200 text-xs text-slate-500 text-center">
                            Gunakan akun database: <br />
                            <b>sdm@kemenlu.go.id</b> (sdm123)
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

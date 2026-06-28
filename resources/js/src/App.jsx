import React, { useState, useEffect } from "react";
import axios from "axios";
import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import MainLayout from "./layouts/MainLayout";
import DashboardAdmin from "./components/DashboardAdmin";
import DataPegawai from "./pages/DataPegawai";
import PerSatker from "./pages/PerSatker";
import DalamNegeri from "./pages/DalamNegeri";
import LuarNegeri from "./pages/LuarNegeri";
import DetailPegawai from "./pages/DetailPegawai";
import UnitKerja from "./pages/UnitKerja";
import DataAdmin from "./components/DataAdmin";
import PengaturanAkun from "./pages/PengaturanAkun";
import PagePublic from "./pages/PagePublic";
import KonsulKehormatan from "./pages/KonsulKehormatan";
import DetailKehormatan from "./pages/DetailKonhor";
import SyncData from "./pages/SyncData";
// import TambahPegawai from "./pages/TambahPegawai";

function ProtectedLayout({ onSignOut }) {
    return (
        <MainLayout onSignOut={onSignOut}>
            <Outlet />
        </MainLayout>
    );
}

export default function App() {
    // 1. Inisialisasi state langsung dari localStorage agar saat refresh tidak logout
    const [authed, setAuthed] = useState(() => {
        const savedStatus = localStorage.getItem("isLoggedIn");
        return savedStatus === "true";
    });

    const navigate = useNavigate();

    // 2. Setup Axios Interceptor agar token otomatis terkirim
    useEffect(() => {
        const requestInterceptor = axios.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem("token");
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    handleSignOut();
                    navigate("/login");
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, []);

    // 2. Fungsi Login: Simpan status ke localStorage
    const handleLogin = () => {
        setAuthed(true);
        localStorage.setItem("isLoggedIn", "true");
    };

    // 3. Fungsi SignOut: Hapus status dari localStorage
    const handleSignOut = () => {
        setAuthed(false);
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_divisi");
    };

    return (
        <Routes>
            <Route path="/" element={<PagePublic />} />
            <Route path="/public" element={<Navigate to="/" replace />} />

            <Route
                path="/login"
                element={
                    authed ? (
                        <Navigate to="/dashboard" replace />
                    ) : (
                        <Login onLogin={handleLogin} />
                    )
                }
            />

            <Route
                element={
                    authed ? (
                        <ProtectedLayout onSignOut={handleSignOut} />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            >
                <Route path="/dashboard" element={<DashboardAdmin />} />
                <Route path="/pegawai" element={<DataPegawai />} />
                <Route path="/satkerja" element={<PerSatker />} />
                <Route path="/satkerja/dalam-negeri" element={<DalamNegeri />} />
                <Route path="/satkerja/luar-negeri" element={<LuarNegeri />} />
                <Route
                    path="/detail-pegawai/:unitId"
                    element={<DetailPegawai />}
                />
                <Route path="/admin" element={<DataAdmin />} />
                {localStorage.getItem("user_role") === "superadmin" && (
                    <>
                        <Route path="/unit-kerja" element={<UnitKerja />} />
                        <Route path="/unit-kerja/form" element={<UnitKerja />} />
                        <Route path="/pengaturan/sync-data" element={<SyncData />} />
                    </>
                )}
                <Route path="/pengaturan/akun" element={<PengaturanAkun />} />
                <Route path="/konsul-kehormatan" element={<KonsulKehormatan />} />
                <Route path="/konsul-kehormatan/:konsulId" element={<DetailKehormatan />} />
            </Route>

            <Route
                path="*"
                element={
                    <Navigate to="/" replace />
                }
            />
        </Routes>
    );
}

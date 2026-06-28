import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
    // Cek apakah ada tiket "isAuthenticated" di penyimpanan browser
    const isAuth = localStorage.getItem("isAuthenticated");

    // Jika ada, izinkan masuk (Outlet). Jika tidak, tendang ke /login
    return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;

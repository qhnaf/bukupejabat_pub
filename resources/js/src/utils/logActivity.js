import axios from "axios";

export const logActivity = async (action, description) => {
    try {
        const userId = localStorage.getItem("user_id");
        const token = localStorage.getItem("token");
        if (!userId || !token) return;

        await axios.post("/api/activity-logs", {
            action: action,
            description: description
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
    } catch (error) {
        console.error("Gagal mencatat log aktivitas:", error);
    }
};

import axios from 'axios';

let rawURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// Remove trailing slashes
rawURL = rawURL.replace(/\/+$/, "");
// Ensure baseURL ends with /api
if (!rawURL.endsWith("/api")) {
    rawURL += "/api";
}

const api = axios.create({
    baseURL: rawURL,
    headers: {
        "Content-Type": "application/json",
    }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if(token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;

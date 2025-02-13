// src/service/authHeader.js
import axios from "axios";
import * as jwtDecode from "jwt-decode";

// Helper function to decode the token
function decodeToken(token) {
    // jwtDecode may be a function on the default property or directly callable
    return typeof jwtDecode === "function"
        ? jwtDecode(token)
        : jwtDecode.default(token);
}

// Check if the token is expired
function isTokenExpired(token) {
    try {
        const decoded = decodeToken(token);
        const currentTime = Date.now() / 1000; // seconds
        return decoded.exp < currentTime;
    } catch (error) {
        // If there's an error decoding, consider the token expired
        return true;
    }
}

// Refresh the access token using the refresh token
async function refreshAccessToken(refreshToken) {
    try {
        const response = await axios.post("/api/token/refresh/", {
            refresh: refreshToken,
        });
        return response.data.access;
    } catch (error) {
        console.error("Error refreshing token:", error);
        throw error;
    }
}

// Main function to get the Authorization header
export default async function authHeader() {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (accessToken && !isTokenExpired(accessToken)) {
        return { Authorization: `Bearer ${accessToken}` };
    } else if (refreshToken) {
        try {
            const newAccessToken = await refreshAccessToken(refreshToken);
            localStorage.setItem("accessToken", newAccessToken);
            return { Authorization: `Bearer ${newAccessToken}` };
        } catch (error) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            return {};
        }
    } else {
        return {};
    }
}

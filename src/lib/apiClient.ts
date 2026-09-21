// lib/apiClient.ts
import axios from 'axios';

// Determine the base URL dynamically based on environment
const getBaseURL = (): string => {
    if (typeof window !== 'undefined') {
        // In browser: if NEXT_PUBLIC_API_URL is explicitly set to a valid non-localhost URL, use it.
        // Otherwise, empty string so all /api requests are relative to current domain (Vercel / production / localhost)
        const envUrl = process.env.NEXT_PUBLIC_API_URL;
        if (envUrl && /^https?:\/\//i.test(envUrl) && !envUrl.includes('localhost')) {
            return envUrl.replace(/\/+$/, '');
        }
        return '';
    }
    // Server-side execution
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || process.env.VERCEL_URL;
    if (serverUrl) {
        return serverUrl.startsWith('http') ? serverUrl.replace(/\/+$/, '') : `https://${serverUrl}`;
    }
    return 'http://localhost:3000';
};

const apiClient = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
    // CRITICAL: This must be true to work with Access-Control-Allow-Credentials
    withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        // Guard against any stale localhost baseURL in production HTTPS environment
        if (
            !config.baseURL ||
            (window.location.protocol === 'https:' && config.baseURL.startsWith('http://localhost')) ||
            config.baseURL === 'http://localhost:3000'
        ) {
            const envUrl = process.env.NEXT_PUBLIC_API_URL;
            if (envUrl && /^https?:\/\//i.test(envUrl) && !envUrl.includes('localhost')) {
                config.baseURL = envUrl.replace(/\/+$/, '');
            } else {
                config.baseURL = '';
            }
        }

        const token = 
            localStorage.getItem("memora_token") || 
            localStorage.getItem("memoryes_token") || 
            localStorage.getItem("token") ||
            localStorage.getItem("admin_token");
            
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default apiClient;
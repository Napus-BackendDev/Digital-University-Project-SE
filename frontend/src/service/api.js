// frontend/src/service/api.js
import axios from 'axios';

const instance = axios.create();

// ตั้งค่า base URL
instance.defaults.baseURL = import.meta.env.VITE_API_URL;

// ตั้งค่า headers เริ่มต้น
instance.defaults.headers = {
    "Content-Type": "application/json",
};


export default {
    // Authentication
    auth(method, data) {
        switch (method) {
            case 'login':
                return instance.post("/auth/login", data);
            case 'register':
                return instance.post("/auth/register", data);
            case 'logout':
                return instance.post("/auth/logout", data);
            default:
                break;
        }
    },
}
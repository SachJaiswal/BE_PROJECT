import axios, { AxiosInstance } from "axios"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"

const instance: AxiosInstance = axios.create({
    baseURL: BACKEND_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30000, // 30 second timeout for code generation
})

export default instance